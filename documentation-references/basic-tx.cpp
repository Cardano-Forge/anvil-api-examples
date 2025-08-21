// g++ -std=c++17 basic-tx.cpp -lcurl -o basic-tx

#include <iostream>
#include <string>
#include <curl/curl.h>

static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* userp) {
    userp->append((char*)contents, size * nmemb);
    return size * nmemb;
}

int main() {
    CURL* curl = curl_easy_init();
    std::string readBuffer;

    std::string requestBody = R"({
        "changeAddress": "addr_test1qrydyk6uw6cehk5u3zspyz3dhnwzmhfls2fp42vv5dv9g2z3885pg4kpkn30ptezc855lu3w5ey93zcr5lrezjmwkftqg8xvge",
        "outputs": [
            {
                "address": "addr_test1qr0tkwvlln0v5fljdxceudmlpt5y6szc84vpj4skm836tgn4hsqaesgg97l8ppy5rsn0alj8pth6lqe20fdyydsdgw6sr74cyt",
                "lovelace": 10000000
            }
        ]
    })";

    curl_easy_setopt(curl, CURLOPT_URL, "https://preprod.api.ada-anvil.app/v2/services/transactions/build");
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, requestBody.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);

    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Content-Type: application/json");
    headers = curl_slist_append(headers, "x-api-key: testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9");
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

    curl_easy_perform(curl);
    std::cout << readBuffer << std::endl;

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    return 0;
}

/*
{
"hash":"05817d1954234cbc67bb715e95165ee829c18902604677d0d7aaa0cbe514bf51",
"complete":"84a600d90102828258202bc2c20fa2cb1ed533dff232805f1b795f4e2d88105d847a96284abcf38c547903825820b78bc0f14cb5675ce477c8b79c990ec490309d981273a5867a8f9cc866d49fd801018382583900debb399ffcdeca27f269b19e377f0ae84d40583d58195616d9e3a5a275bc01dcc1082fbe7084941c26fefe470aefaf832a7a5a42360d43b51a00989680a300581d605a052cdb5e579f4e523e42fd3e682a264a7b117279671e23d4e91b94011a00162010028201d8184a49616e76696c2d74616782583900c8d25b5c76b19bda9c88a0120a2dbcdc2ddd3f82921aa98ca35854285139e81456c1b4e2f0af22c1e94ff22ea648588b03a7c7914b6eb2561b000000018947f274021a00030961031a05f7d16d081a05f7b54d0ed9010281581c5a052cdb5e579f4e523e42fd3e682a264a7b117279671e23d4e91b94a100d90102818258201a710263fdc20434fc8a5f7355aade3ea8f87c2bb9c805d1d415d86efe20ebda58404674811ee18646ae959d532c10ab92017df7fcec380b8781bb2c063b9b43c44232cb9f6cf0ceaed6947a8cf9c464056d125282752b84e1f9ee091212d22f7f0ff5f6",
"stripped":"84a600d90102828258202bc2c20fa2cb1ed533dff232805f1b795f4e2d88105d847a96284abcf38c547903825820b78bc0f14cb5675ce477c8b79c990ec490309d981273a5867a8f9cc866d49fd801018382583900debb399ffcdeca27f269b19e377f0ae84d40583d58195616d9e3a5a275bc01dcc1082fbe7084941c26fefe470aefaf832a7a5a42360d43b51a00989680a300581d605a052cdb5e579f4e523e42fd3e682a264a7b117279671e23d4e91b94011a00162010028201d8184a49616e76696c2d74616782583900c8d25b5c76b19bda9c88a0120a2dbcdc2ddd3f82921aa98ca35854285139e81456c1b4e2f0af22c1e94ff22ea648588b03a7c7914b6eb2561b000000018947f274021a00030961031a05f7d16d081a05f7b54d0ed9010281581c5a052cdb5e579f4e523e42fd3e682a264a7b117279671e23d4e91b94a0f5f6",
"witnessSet":"a100d90102818258201a710263fdc20434fc8a5f7355aade3ea8f87c2bb9c805d1d415d86efe20ebda58404674811ee18646ae959d532c10ab92017df7fcec380b8781bb2c063b9b43c44232cb9f6cf0ceaed6947a8cf9c464056d125282752b84e1f9ee091212d22f7f0f"
}
*/