// ESP32 Arduino IDE example
// Install ESP32 board package and HTTPClient library
// Set WiFi credentials below

#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "WIFI_SSID";
const char* password = "WIFI_PASSWORD";

void setup() {
    Serial.begin(115200);
    
    // Connect to WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
    }
    
    // Make API call
    makeAnvilAPICall();
}

void loop() {
    // Empty - run once in setup()
}

void makeAnvilAPICall() {
    HTTPClient http;
    http.begin("https://preprod.api.ada-anvil.app/v2/services/transactions/build");
    
    // Set headers
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", "testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9");
    
    // JSON payload
    String requestBody = R"({
        "changeAddress": "addr_test1qrydyk6uw6cehk5u3zspyz3dhnwzmhfls2fp42vv5dv9g2z3885pg4kpkn30ptezc855lu3w5ey93zcr5lrezjmwkftqg8xvge",
        "outputs": [
            {
                "address": "addr_test1qr0tkwvlln0v5fljdxceudmlpt5y6szc84vpj4skm836tgn4hsqaesgg97l8ppy5rsn0alj8pth6lqe20fdyydsdgw6sr74cyt",
                "lovelace": 10000000
            }
        ]
    })";
    
    // Make POST request
    int httpResponseCode = http.POST(requestBody);
    
    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.println(response);
    }
    
    http.end();
}

/*
{
  "hash":"465de374d4e85130201aa6be3a575a54dcedd8be9cfc1e4111864fa86e959f6a",
  "complete":"84a600d90102828258202bc2c20fa2cb1ed533dff232805f1b795f4e2d88105d847a96284abcf38c54790382582074aef3bfc5c824e06cd707260faadeb0d4dcd2f3efb8fd9150640c9fbd364e5f01018382583900debb399ffcdeca27f269b19e377f0ae84d40583d58195616d9e3a5a275bc01dcc1082fbe7084941c26fefe470aefaf832a7a5a42360d43b51a00989680a300581d60838f5d45dcd53854a214d717e5941e62e3b001dbb29b87a4dbcf9ab9011a00162010028201d8184a49616e76696c2d74616782583900c8d25b5c76b19bda9c88a0120a2dbcdc2ddd3f82921aa98ca35854285139e81456c1b4e2f0af22c1e94ff22ea648588b03a7c7914b6eb2561b000000018947f274021a00030961031a05f7ebbe081a05f7cf9e0ed9010281581c838f5d45dcd53854a214d717e5941e62e3b001dbb29b87a4dbcf9ab9a100d9010281825820b5c1c82b5f5bcec6e8d053d7eeb0fe4aa1009561690c0af53c0804cb59d2c0295840b6641dd563b08779e36b310c5c0884b5476c5992f5c7538b4a43c72d511f6f18e69a4c5a7203a18a709ea13f95d90d8d4af70c427d265169620497a766a75801f5f6",
  "stripped":"84a600d90102828258202bc2c20fa2cb1ed533dff232805f1b795f4e2d88105d847a96284abcf38c54790382582074aef3bfc5c824e06cd707260faadeb0d4dcd2f3efb8fd9150640c9fbd364e5f01018382583900debb399ffcdeca27f269b19e377f0ae84d40583d58195616d9e3a5a275bc01dcc1082fbe7084941c26fefe470aefaf832a7a5a42360d43b51a00989680a300581d60838f5d45dcd53854a214d717e5941e62e3b001dbb29b87a4dbcf9ab9011a00162010028201d8184a49616e76696c2d74616782583900c8d25b5c76b19bda9c88a0120a2dbcdc2ddd3f82921aa98ca35854285139e81456c1b4e2f0af22c1e94ff22ea648588b03a7c7914b6eb2561b000000018947f274021a00030961031a05f7ebbe081a05f7cf9e0ed9010281581c838f5d45dcd53854a214d717e5941e62e3b001dbb29b87a4dbcf9ab9a0f5f6",
  "witnessSet":"a100d9010281825820b5c1c82b5f5bcec6e8d053d7eeb0fe4aa1009561690c0af53c0804cb59d2c0295840b6641dd563b08779e36b310c5c0884b5476c5992f5c7538b4a43c72d511f6f18e69a4c5a7203a18a709ea13f95d90d8d4af70c427d265169620497a766a75801"
}
*/
