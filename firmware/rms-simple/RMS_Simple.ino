#include <driver/i2s.h>

#define I2S_WS 14
#define I2S_SCK 2
#define I2S_SD 13
#define BUFFER_SIZE 256

int32_t samples[BUFFER_SIZE];

unsigned long triggerTimeMicros = 0;

void setup()
{
    Serial.begin(115200);

    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = 16000,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_RIGHT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 64};

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SCK,
        .ws_io_num = I2S_WS,
        .data_out_num = I2S_PIN_NO_CHANGE,
        .data_in_num = I2S_SD};

    i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_NUM_0, &pin_config);
    delay(100);
}

void loop()
{
    size_t bytes_read;
    i2s_read(I2S_NUM_0, samples, sizeof(samples), &bytes_read, portMAX_DELAY);
    int num_samples = bytes_read / sizeof(int32_t);

    int32_t peak_positive = 0, peak_negative = 0;
    long long sum_sq = 0;

    for (int i = 0; i < num_samples; i++)
    {
        int32_t val = samples[i] >> 8;
        if (val > peak_positive)
            peak_positive = val;
        if (val < peak_negative)
            peak_negative = val;
        sum_sq += (long long)val * val;
    }

    triggerTimeMicros = micros();
    int32_t rms = sqrt(sum_sq / num_samples);

    unsigned long captureTime = micros();
    unsigned long latency = captureTime - triggerTimeMicros;
    Serial.printf("Latency from trigger to photo capture: %lu us (%.2f ms)\n", latency, latency / 1000.0);

    Serial.print("Peak -: ");
    Serial.print(peak_negative);
    Serial.print("  Peak +: ");
    Serial.print(peak_positive);
    Serial.print("  RMS: ");
    Serial.println(rms);

    delay(1000);
}
