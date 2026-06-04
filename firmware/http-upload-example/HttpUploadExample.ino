#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_camera.h"

const char *WIFI_SSID = "Colocar meu wifi aqui";
const char *WIFI_PASSWORD = "minha senha aqui";

const char *SERVER_URL = "http://IP_LOCAL:3333/api/events?algorithm=RMS_TWO_STAGE";

bool uploadFrame(camera_fb_t *fb)
{
    if (!fb)
    {
        Serial.println("Frame inválido");
        return false;
    }

    WiFiClient client;
    HTTPClient http;

    String boundary = "----NoiseWatchBoundary";
    String head = "--" + boundary + "\r\n";
    head += "Content-Disposition: form-data; name=\"image\"; filename=\"snapshot.jpg\"\r\n";
    head += "Content-Type: image/jpeg\r\n\r\n";

    String tail = "\r\n--" + boundary + "--\r\n";

    uint32_t totalLength = head.length() + fb->len + tail.length();

    http.begin(client, SERVER_URL);
    http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
    http.addHeader("Content-Length", String(totalLength));

    uint8_t *body = (uint8_t *)malloc(totalLength);
    if (!body)
    {
        Serial.println("Falha ao alocar memória para upload");
        http.end();
        return false;
    }

    memcpy(body, head.c_str(), head.length());
    memcpy(body + head.length(), fb->buf, fb->len);
    memcpy(body + head.length() + fb->len, tail.c_str(), tail.length());

    int httpCode = http.POST(body, totalLength);
    free(body);

    String response = http.getString();
    http.end();

    Serial.printf("HTTP status: %d\n", httpCode);
    Serial.println(response);

    return httpCode >= 200 && httpCode < 300;
}