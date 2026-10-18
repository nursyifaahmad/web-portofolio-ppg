/*
 * ==============================================================================
 * PROJEK KEPEMIMPINAN PPG PRAJABATAN - UNIVERSITAS PENDIDIKAN INDONESIA
 * SISTEM SIDAKAN (Sistem IoT Deteksi Dini Kelayakan Makanan MBG)
 * ==============================================================================
 * Mikrokontroler: ESP32-S (38-Pin / NodeMCU-32S)
 * Versi Firmware: 1.0.0 (Production Release)
 * Penulis: Anthonio Akbar, S.Kom. (NIM: 2530710)
 * 
 * PEMETAAN PIN HARDWARE (ESP32-S 38-Pin):
 * - Pin 5  (Left)  : GPIO 34 (ADC1_CH6) -> Sensor Gas MQ-135 (Pin AOUT)
 * - Pin 26 (Right) : GPIO 25             -> Sensor Suhu & Kelembapan DHT11 (Pin DATA)
 * - Pin 33 (Right) : GPIO 21 (I2C SDA)  -> Layar OLED SSD1306 0.96" (Pin SDA)
 * - Pin 36 (Right) : GPIO 22 (I2C SCL)  -> Layar OLED SSD1306 0.96" (Pin SCL)
 * - Pin 9  (Left)  : GPIO 25            -> Indikator LED Hijau (Status: AMAN)
 * - Pin 10 (Left)  : GPIO 26            -> Indikator LED Kuning (Status: WASPADA)
 * - Pin 11 (Left)  : GPIO 27            -> Indikator LED Merah (Status: BAHAYA)
 * - Pin 12 (Left)  : GPIO 14            -> Active Buzzer 5V (Alarm Bunyi)
 * - Pin 15 (Left)  : GPIO 13            -> Push Button Kalibrasi / Reset (INPUT_PULLUP)
 * - Pin 19 (Left)  : VIN / 5V           -> Rel Catu Daya 5V (Pemanas MQ-135)
 * - Pin 1  (Left)  : 3V3                -> Rel Catu Daya 3.3V (DHT11 & OLED)
 * - Pin 14 (Left)  : GND                -> Rel Ground Bersama (Common Ground)
 * 
 * PERINGATAN KRUSIAL:
 * Jangan menggunakan GPIO 6, 7, 8, 9, 10, 11 (Pin Fisik 16-18 & 20-22) karena 
 * terhubung langsung secara internal ke chip memori SPI Flash.
 * ==============================================================================
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

// ------------------------------------------------------------------------------
// DEFINISI KONFIGURASI PIN FISIK ESP32-S (38-PIN)
// ------------------------------------------------------------------------------
#define PIN_MQ135       34      // ADC1_CH6 (Hanya Input, bebas konflik Wi-Fi)
#define PIN_DHT         4       // GPIO 4 (Digital I/O dengan Pull-Up 10k Ohm)
#define PIN_LED_HIJAU   25      // GPIO 25 (Status AMAN)
#define PIN_LED_KUNING  26      // GPIO 26 (Status WASPADA)
#define PIN_LED_MERAH   27      // GPIO 27 (Status BAHAYA)
#define PIN_BUZZER      14      // GPIO 14 (Active Buzzer Alarm)
#define PIN_BUTTON      13      // GPIO 13 (Tombol Kalibrasi / Reset Mode)

// ------------------------------------------------------------------------------
// KONFIGURASI MODUL DISPLAY OLED SSD1306 (128x64 Pixel)
// ------------------------------------------------------------------------------
#define SCREEN_WIDTH    128     // Lebar layar dalam satuan pixel
#define SCREEN_HEIGHT   64      // Tinggi layar dalam satuan pixel
#define OLED_RESET      -1      // Reset pin (-1 jika berbagi pin reset mikrokontroler)
#define OLED_I2C_ADDR   0x3C    // Alamat I2C default layar OLED (atau 0x3D)

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ------------------------------------------------------------------------------
// KONFIGURASI SENSOR DHT11
// ------------------------------------------------------------------------------
#define DHTTYPE         DHT11   // Tipe sensor DHT (DHT11)
DHT dht(PIN_DHT, DHTTYPE);

// ------------------------------------------------------------------------------
// PARAMETER AMBANG BATAS & KALIBRASI SISTEM (TRI-STATE)
// ------------------------------------------------------------------------------
// Nilai ADC Sensor Gas MQ-135 (Rentang 12-bit ESP32: 0 - 4095)
const int THRESHOLD_GAS_WARNING = 1200; // Mulai terdeteksi gas amonia/dekomposisi ringan
const int THRESHOLD_GAS_DANGER  = 2200; // Dekomposisi protein pekat (Makanan Tidak Layak)

// Ambang Batas Suhu Lingkungan (°C) Mengacu Standar "Danger Zone" WHO
const float THRESHOLD_TEMP_WARNING = 32.0; // Suhu ruang mulai mempercepat kolonisasi bakteri
const float THRESHOLD_TEMP_DANGER  = 38.0; // Suhu kritis akselerasi pembusukan biologis

// Enumerasi Status Kelayakan Tri-State
enum SystemStatus {
  STATUS_AMAN,
  STATUS_WASPADA,
  STATUS_BAHAYA
};

SystemStatus currentStatus = STATUS_AMAN;

// ------------------------------------------------------------------------------
// VARIABEL PENGATUR WAKTU NON-BLOCKING (MILLIS)
// ------------------------------------------------------------------------------
unsigned long previousMillisSensor = 0;   // Waktu pencatatan sensor terakhir
const long intervalSensor = 1000;         // Interval pembacaan sensor (1 detik)

unsigned long previousMillisBuzzer = 0;   // Waktu toggle buzzer alarm
bool buzzerState = false;                 // Status hidup/mati buzzer pada mode bahaya

// Filter Rata-rata Bergerak (Rolling Average) untuk Menghilangkan Derau ADC
const int NUM_READINGS = 10;
int gasReadings[NUM_READINGS];
int readIndex = 0;
long totalGas = 0;
int averageGas = 0;

// ==============================================================================
// FUNGSI INISIALISASI (SETUP)
// ==============================================================================
void setup() {
  // 1. Inisialisasi Komunikasi Serial UART (Kecepatan 115200 Baud)
  Serial.begin(115200);
  delay(500);
  Serial.println(F("\n=================================================="));
  Serial.println(F("   SISTEM SIDAKAN - PENGUJIAN KELAYAKAN MAKANAN"));
  Serial.println(F("   Projek Kepemimpinan PPG Prajabatan Informatika"));
  Serial.println(F("=================================================="));

  // 2. Inisialisasi Mode Pin GPIO
  pinMode(PIN_LED_HIJAU, OUTPUT);
  pinMode(PIN_LED_KUNING, OUTPUT);
  pinMode(PIN_LED_MERAH, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_BUTTON, INPUT_PULLUP); // Memanfaatkan resistor pull-up internal ESP32

  // Matikan semua aktuator di awal
  digitalWrite(PIN_LED_HIJAU, LOW);
  digitalWrite(PIN_LED_KUNING, LOW);
  digitalWrite(PIN_LED_MERAH, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // 3. Inisialisasi Bus I2C & Layar OLED SSD1306 (GPIO 21 = SDA, GPIO 22 = SCL)
  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR)) {
    Serial.println(F("[ERROR] Layar OLED SSD1306 tidak terdeteksi pada alamat 0x3C!"));
    // Beri kedip LED Merah jika OLED gagal terdeteksi
    for (int i = 0; i < 5; i++) {
      digitalWrite(PIN_LED_MERAH, HIGH);
      delay(150);
      digitalWrite(PIN_LED_MERAH, LOW);
      delay(150);
    }
  } else {
    Serial.println(F("[OK] Layar OLED SSD1306 berhasil diinisialisasi."));
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    
    // Tampilan Layar Splash Pembuka
    display.setTextSize(1);
    display.setCursor(18, 10);
    display.print(F("SISTEM SIDAKAN"));
    display.setCursor(12, 26);
    display.print(F("Deteksi Pangan MBG"));
    display.setCursor(15, 42);
    display.print(F("PPG PRAJABATAN UPI"));
    display.display();
    delay(2000);
  }

  // 4. Inisialisasi Sensor DHT11
  dht.begin();
  Serial.println(F("[OK] Sensor Suhu & Kelembapan DHT11 aktif."));

  // 5. Inisialisasi Array Filter Pembacaan Gas MQ-135
  for (int i = 0; i < NUM_READINGS; i++) {
    gasReadings[i] = analogRead(PIN_MQ135);
    totalGas += gasReadings[i];
    delay(20);
  }
  averageGas = totalGas / NUM_READINGS;
  Serial.println(F("[OK] Filter awal MQ-135 selesai dihitung."));

  // Self-Test Singkat Indikator LED (Blink Test)
  digitalWrite(PIN_LED_HIJAU, HIGH);
  delay(200);
  digitalWrite(PIN_LED_HIJAU, LOW);
  digitalWrite(PIN_LED_KUNING, HIGH);
  delay(200);
  digitalWrite(PIN_LED_KUNING, LOW);
  digitalWrite(PIN_LED_MERAH, HIGH);
  delay(200);
  digitalWrite(PIN_LED_MERAH, LOW);

  Serial.println(F("[READY] Sistem SIDAKAN Siap Beroperasi Normal.\n"));
}

// ==============================================================================
// LOOP UTAMA (EKSEKUSI PROGRAM SECARA BERKELANJUTAN)
// ==============================================================================
void loop() {
  unsigned long currentMillis = millis();

  // ----------------------------------------------------------------------------
  // SIKLUS PEMBACAAN SENSOR & EVALUASI (SETIAP 1 DETIK)
  // ----------------------------------------------------------------------------
  if (currentMillis - previousMillisSensor >= intervalSensor) {
    previousMillisSensor = currentMillis;

    // 1. Membaca Sensor Gas MQ-135 dengan Rolling Average
    int rawGas = analogRead(PIN_MQ135);
    totalGas = totalGas - gasReadings[readIndex];
    gasReadings[readIndex] = rawGas;
    totalGas = totalGas + gasReadings[readIndex];
    readIndex = (readIndex + 1) % NUM_READINGS;
    averageGas = totalGas / NUM_READINGS;

    // 2. Membaca Sensor Suhu & Kelembapan DHT11
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    // Validasi Pembacaan DHT11
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println(F("[WARN] Gagal membaca data dari sensor DHT11! Periksa kabel jumper."));
      temperature = 0.0;
      humidity = 0.0;
    }

    // 3. Evaluasi Logika Klasifikasi Tri-State
    if (averageGas >= THRESHOLD_GAS_DANGER || temperature >= THRESHOLD_TEMP_DANGER) {
      currentStatus = STATUS_BAHAYA;
    } else if (averageGas >= THRESHOLD_GAS_WARNING || temperature >= THRESHOLD_TEMP_WARNING) {
      currentStatus = STATUS_WASPADA;
    } else {
      currentStatus = STATUS_AMAN;
    }

    // 4. Update Tampilan Layar OLED SSD1306
    updateOLED(averageGas, temperature, humidity, currentStatus);

    // 5. Cetak Data Log ke Serial Monitor untuk Pemantauan Komputer
    printSerialLog(averageGas, temperature, humidity, currentStatus);
  }

  // ----------------------------------------------------------------------------
  // KONTROL AKTUATOR INDIKATOR DAN ALARM
  // ----------------------------------------------------------------------------
  updateActuators(currentStatus, currentMillis);

  // ----------------------------------------------------------------------------
  // DETEKSI PENEKANAN TOMBOL RESET / KALIBRASI
  // ----------------------------------------------------------------------------
  if (digitalRead(PIN_BUTTON) == LOW) {
    handleButtonPress();
  }
}

// ==============================================================================
// FUNGSI UPDATE LAYAR OLED (ANTARMUKA VISUAL LOKAL)
// ==============================================================================
void updateOLED(int gasValue, float temp, float hum, SystemStatus status) {
  display.clearDisplay();
  
  // Header Judul Layar
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print(F("SIDAKAN - MONITOR MBG"));
  display.drawLine(0, 10, 127, 10, SSD1306_WHITE);

  // Pembacaan Parameter Fisik
  display.setCursor(0, 15);
  display.print(F("Gas NH3 : "));
  display.print(gasValue);
  display.print(F(" ADC"));

  display.setCursor(0, 27);
  display.print(F("Suhu    : "));
  display.print(temp, 1);
  display.print(F(" C"));

  display.setCursor(0, 39);
  display.print(F("Lembap  : "));
  display.print(hum, 1);
  display.print(F(" %RH"));

  // Baris Status Kelayakan Pangan (Inverse Banner untuk Menarik Perhatian)
  display.drawLine(0, 50, 127, 50, SSD1306_WHITE);
  display.setCursor(0, 54);
  display.print(F("STATUS: "));

  switch (status) {
    case STATUS_AMAN:
      display.print(F("[AMAN / LAYAK]"));
      break;
    case STATUS_WASPADA:
      display.print(F("[WASPADA / CEK]"));
      break;
    case STATUS_BAHAYA:
      display.print(F("[BAHAYA / BASI!]"));
      break;
  }

  display.display();
}

// ==============================================================================
// FUNGSI KONTROL AKTUATOR (LED & BUZZER)
// ==============================================================================
void updateActuators(SystemStatus status, unsigned long currentMillis) {
  switch (status) {
    case STATUS_AMAN:
      digitalWrite(PIN_LED_HIJAU, HIGH);
      digitalWrite(PIN_LED_KUNING, LOW);
      digitalWrite(PIN_LED_MERAH, LOW);
      digitalWrite(PIN_BUZZER, LOW);
      break;

    case STATUS_WASPADA:
      digitalWrite(PIN_LED_HIJAU, LOW);
      digitalWrite(PIN_LED_KUNING, HIGH);
      digitalWrite(PIN_LED_MERAH, LOW);
      digitalWrite(PIN_BUZZER, LOW);
      break;

    case STATUS_BAHAYA:
      digitalWrite(PIN_LED_HIJAU, LOW);
      digitalWrite(PIN_LED_KUNING, LOW);
      digitalWrite(PIN_LED_MERAH, HIGH);

      // Buzzer berbunyi bip berirama (pulsing) setiap 200 ms
      if (currentMillis - previousMillisBuzzer >= 200) {
        previousMillisBuzzer = currentMillis;
        buzzerState = !buzzerState;
        digitalWrite(PIN_BUZZER, buzzerState ? HIGH : LOW);
      }
      break;
  }
}

// ==============================================================================
// FUNGSI PENEKANAN TOMBOL RESET / KALIBRASI CEPAT
// ==============================================================================
void handleButtonPress() {
  Serial.println(F("\n[TOMBOL DITEKAN] Memulai Kalibrasi Ulang Sensor MQ-135..."));
  
  // Tampilkan pesan kalibrasi di layar OLED
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(15, 20);
  display.print(F("KALIBRASI SENSOR"));
  display.setCursor(10, 36);
  display.print(F("Merekam Baseline R0"));
  display.display();

  // Hitung ulang baseline dalam 2 detik
  totalGas = 0;
  for (int i = 0; i < NUM_READINGS; i++) {
    gasReadings[i] = analogRead(PIN_MQ135);
    totalGas += gasReadings[i];
    delay(100);
  }
  averageGas = totalGas / NUM_READINGS;
  
  Serial.print(F("[INFO] Nilai Baseline Baru Tercatat: "));
  Serial.println(averageGas);

  // Bunyikan buzzer singkat tanda kalibrasi sukses
  digitalWrite(PIN_BUZZER, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER, LOW);

  // Tunggu hingga tombol dilepas agar tidak memicu loop ganda (Debouncing sederhana)
  while (digitalRead(PIN_BUTTON) == LOW) {
    delay(10);
  }
}

// ==============================================================================
// FUNGSI LOGGING SERIAL MONITOR
// ==============================================================================
void printSerialLog(int gasValue, float temp, float hum, SystemStatus status) {
  Serial.print(F("Time: "));
  Serial.print(millis() / 1000);
  Serial.print(F("s | Gas ADC: "));
  Serial.print(gasValue);
  Serial.print(F(" | Temp: "));
  Serial.print(temp, 1);
  Serial.print(F(" C | Humidity: "));
  Serial.print(hum, 1);
  Serial.print(F(" %RH | Status: "));

  switch (status) {
    case STATUS_AMAN:
      Serial.println(F("AMAN (Hijau)"));
      break;
    case STATUS_WASPADA:
      Serial.println(F("WASPADA (Kuning)"));
      break;
    case STATUS_BAHAYA:
      Serial.println(F("BAHAYA (Merah + Buzzer ON!)"));
      break;
  }
}
