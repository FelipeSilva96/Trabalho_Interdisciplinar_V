/*
 * Sound‑Triggered Camera with HTTP Upload
 * Hardware: ESP32‑CAM (AI‑Thinker) + INMP441 microphone
 *
 * Connections (INMP441 → ESP32‑CAM):
 *   VDD  → 3.3V
 *   GND  → GND (use the working GND pin, e.g., the one near 5V)
 *   SD   → GPIO13
 *   WS   → GPIO14
 *   SCK  → GPIO2
 *   L/R  → GND (connect directly to GND)
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <driver/i2s.h>

// ========== CONFIGURATION ==========
unsigned long triggerTimeMicros = 0; // timestamp of detection event

// Wi‑Fi credentials
const char *ssid = "IMPLANTAR_MARILENE";
const char *password = "Rikerson1!";

// Server endpoint (e.g., your PHP script or a test server)
// Example: "http://192.168.1.100/upload.php"
const char *serverUrl = "http://IP_LOCAL:3333/api/events?algorithm=RMS_TWO_STAGE&latencyUs=46"; // <-- trocar IP LOCAL  pelo IPv4 do computador

// Sound detection parameters
const float TRIGGER_MULTIPLIER = 4.5; // threshold = noiseFloor * multiplier
const float ALPHA = 0.95;             // noise floor smoothing (0.95 = slow)
const int COOLDOWN_MS = 1000;         // wait after trigger (prevents multiple shots)

// I2S microphone pins
#define I2S_WS 14
#define I2S_SCK 2 // changed from GPIO2 to GPIO12 (free pin)
#define I2S_SD 13

// I2S configuration
const i2s_config_t i2sConfig = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = 44100, // good for transient sounds
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_RIGHT, // works with L/R = GND
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 256};

const i2s_pin_config_t i2sPinConfig = {
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_SD};

// ========== CAMERA PIN DEFINITIONS (AI‑THINKER) ==========
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

// ========== PROTOTYPES ==========
void initCamera();
void initMicrophone();
float getCurrentRMS();
bool uploadPhoto(uint8_t *buf, size_t len);
void takePhotoAndUpload();

// ========== GLOBALS ==========
float noiseFloor = 20000.0; // initial guess (will adapt)
bool triggered = false;
unsigned long lastTriggerTime = 0;

// ========== SETUP ==========
void setup()
{
    Serial.begin(115200);
    delay(1000);
    Serial.println("\nStarting Sound‑Triggered Camera...");

    // Initialize camera
    initCamera();

    // Initialize microphone
    initMicrophone();

    // Connect to Wi‑Fi
    WiFi.begin(ssid, password);
    Serial.print("Connecting to Wi‑Fi");
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWi‑Fi connected. IP address: " + WiFi.localIP().toString());
}

// ========== MAIN LOOP ==========
void loop()
{
    // Calculate current RMS value from microphone
    triggerTimeMicros = micros();
    float rms = getCurrentRMS();
    // Print RMS once per second (roughly)
    static unsigned long lastPrint = 0;
    if (millis() - lastPrint > 1000)
    {
        Serial.print("RMS: ");
        Serial.println(rms);
        lastPrint = millis();
    }

    // Update noise floor only when not in a triggered state
    if (!triggered && (millis() - lastTriggerTime > COOLDOWN_MS))
    {
        noiseFloor = ALPHA * noiseFloor + (1.0 - ALPHA) * rms;
    }

    float threshold = noiseFloor * TRIGGER_MULTIPLIER;

    // Trigger condition
    if (!triggered && rms > threshold && rms > 50000)
    { // minimum threshold to avoid noise spikes
        triggered = true;
        lastTriggerTime = millis();
        // --- MEASURE LATENCY ---
        unsigned long captureTime = micros();
        unsigned long latency = captureTime - triggerTimeMicros;
        Serial.printf("Latency from trigger to photo capture: %lu us (%.2f ms)\n", latency, latency / 1000.0);

        Serial.printf("TRIGGER! RMS = %.0f  (noiseFloor = %.0f, threshold = %.0f)\n",
                      rms, noiseFloor, threshold);

        // Take photo and upload
        takePhotoAndUpload();

        triggered = false; // ready for next trigger after cooldown
    }

    // Small delay to avoid overwhelming serial output
    delay(50);
}

// ========== CAMERA INITIALIZATION (from CameraWebServer) ==========
void initCamera()
{
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;
    config.frame_size = FRAMESIZE_QVGA; // 320x240, suitable for upload
    config.jpeg_quality = 12;           // 0‑63, lower = better quality
    config.fb_count = 1;                // double buffer would need more PSRAM

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK)
    {
        Serial.printf("Camera init failed with error 0x%x\n", err);
        while (1)
        {
            delay(100);
        }
    }
    Serial.println("Camera ready");
}

// ========== I2S MICROPHONE INITIALIZATION ==========
void initMicrophone()
{
    i2s_driver_install(I2S_NUM_1, &i2sConfig, 0, NULL);
    i2s_set_pin(I2S_NUM_1, &i2sPinConfig);
    delay(100);
    Serial.println("Microphone ready");
}

// ========== READ RMS FROM MICROPHONE ==========
float getCurrentRMS()
{
    const int samplesToRead = 256;
    int32_t samples[samplesToRead];
    size_t bytesRead;
    i2s_read(I2S_NUM_1, samples, sizeof(samples), &bytesRead, portMAX_DELAY);
    int numSamples = bytesRead / sizeof(int32_t);
    long long sumSq = 0;
    for (int i = 0; i < numSamples; i++)
    {
        int32_t val = samples[i] >> 8; // convert 32‑bit to 24‑bit signed
        sumSq += (long long)val * val;
    }
    float rms = sqrt((float)sumSq / numSamples);
    return rms;
}

// ========== CAPTURE PHOTO AND UPLOAD ==========
void takePhotoAndUpload()
{
    // Capture a photo
    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb)
    {
        Serial.println("Camera capture failed");
        return;
    }
    Serial.printf("Photo captured: %d bytes\n", fb->len);

    // Upload the photo
    bool success = uploadPhoto(fb->buf, fb->len);

    // Return the frame buffer to free memory
    esp_camera_fb_return(fb);

    if (success)
    {
        Serial.println("Upload successful");
    }
    else
    {
        Serial.println("Upload failed");
    }
}

// ========== HTTP POST UPLOAD (multipart/form-data) ==========
bool uploadPhoto(uint8_t *buf, size_t len)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("Wi‑Fi disconnected");
        return false;
    }

    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "multipart/form-data; boundary=----ESP32CAM");

    // Build the multipart body manually (simple version)
    String boundary = "----ESP32CAM";
    String part1 = "--" + boundary + "\r\n";
    part1 += "Content-Disposition: form-data; name=\"image\"; filename=\"snapshot.jpg\"\r\n";
    part1 += "Content-Type: image/jpeg\r\n\r\n";
    String part2 = "\r\n--" + boundary + "--\r\n";

    // Calculate total length and allocate buffer
    size_t totalLen = part1.length() + len + part2.length();
    uint8_t *postData = (uint8_t *)malloc(totalLen);
    if (!postData)
    {
        Serial.println("Failed to allocate upload buffer");
        return false;
    }

    // Copy parts into buffer
    size_t offset = 0;
    memcpy(postData + offset, part1.c_str(), part1.length());
    offset += part1.length();
    memcpy(postData + offset, buf, len);
    offset += len;
    memcpy(postData + offset, part2.c_str(), part2.length());

    // Send POST request
    int httpCode = http.POST(postData, totalLen);
    free(postData);

    bool success = false;
    if (httpCode == 200 || httpCode == 201)
    {
        success = true;
    }
    else
    {
        Serial.printf("HTTP POST failed, code: %d\n", httpCode);
        String response = http.getString();
        Serial.println(response);
    }
    http.end();
    return success;
}
