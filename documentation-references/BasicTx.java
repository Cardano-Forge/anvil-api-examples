// javac BasicTx.java && java BasicTx

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class BasicTx {
    public static void main(String[] args) throws Exception {
        String requestBody = """
            {
                "changeAddress": "addr_test1qrydyk6uw6cehk5u3zspyz3dhnwzmhfls2fp42vv5dv9g2z3885pg4kpkn30ptezc855lu3w5ey93zcr5lrezjmwkftqg8xvge",
                "outputs": [
                    {
                        "address": "addr_test1qr0tkwvlln0v5fljdxceudmlpt5y6szc84vpj4skm836tgn4hsqaesgg97l8ppy5rsn0alj8pth6lqe20fdyydsdgw6sr74cyt",
                        "lovelace": 10000000
                    }
                ]
            }
            """;

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://preprod.api.ada-anvil.app/v2/services/transactions/build"))
                .header("Content-Type", "application/json")
                .header("x-api-key", "testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}

/*
{"hash":"ec6dd532a9ddd2063f51605ca8615079f95c511b86eb4403669244e7cdff3e4c",
"complete":"84a600d90102828258202bc2c20fa2cb1ed533dff232805f1b795f4e2d88105d847a96284abcf38c54790382582074aef3bfc5c824e06cd707260faadeb0d4dcd2f3efb8fd9150640c9fbd364e5f01018382583900debb399ffcdeca27f269b19e377f0ae84d40583d58195616d9e3a5a275bc01dcc1082fbe7084941c26fefe470aefaf832a7a5a42360d43b51a00989680a300581d60838f5d45dcd53854a214d717e5941e62e3b001dbb29b87a4dbcf9ab9011a00162010028201d8184a49616e76696c2d74616782583900c8d25b5c76b19bda9c88a0120a2dbcdc2ddd3f82921aa98ca35854285139e81456c1b4e2f0af22c1e94ff22ea648588b03a7c7914b6eb2561b000000018947f274021a00030961031a05f7c3e6081a05f7a7c60ed9010281581c838f5d45dcd53854a214d717e5941e62e3b001dbb29b87a4dbcf9ab9a100d9010281825820b5c1c82b5f5bcec6e8d053d7eeb0fe4aa1009561690c0af53c0804cb59d2c0295840e346be0aceaa729276d7c2fb722f4a761db6610930fc67a5fe0a8168bc7c0348601938e9a9efbfc499056825ed299ba52c33ec186d1ce13cad69dccda003f10ff5f6",
"stripped":"84a600d90102828258202bc2c20fa2cb1ed533dff232805f1b795f4e2d88105d847a96284abcf38c54790382582074aef3bfc5c824e06cd707260faadeb0d4dcd2f3efb8fd9150640c9fbd364e5f01018382583900debb399ffcdeca27f269b19e377f0ae84d40583d58195616d9e3a5a275bc01dcc1082fbe7084941c26fefe470aefaf832a7a5a42360d43b51a00989680a300581d60838f5d45dcd53854a214d717e5941e62e3b001dbb29b87a4dbcf9ab9011a00162010028201d8184a49616e76696c2d74616782583900c8d25b5c76b19bda9c88a0120a2dbcdc2ddd3f82921aa98ca35854285139e81456c1b4e2f0af22c1e94ff22ea648588b03a7c7914b6eb2561b000000018947f274021a00030961031a05f7c3e6081a05f7a7c60ed9010281581c838f5d45dcd53854a214d717e5941e62e3b001dbb29b87a4dbcf9ab9a0f5f6",
"witnessSet":"a100d9010281825820b5c1c82b5f5bcec6e8d053d7eeb0fe4aa1009561690c0af53c0804cb59d2c0295840e346be0aceaa729276d7c2fb722f4a761db6610930fc67a5fe0a8168bc7c0348601938e9a9efbfc499056825ed299ba52c33ec186d1ce13cad69dccda003f10f"
}
*/

