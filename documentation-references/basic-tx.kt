// kotlinc basic-tx.kt -include-runtime -d basic-tx.jar && java -jar basic-tx.jar
// Or: kotlin -classpath . BasicTxKt

import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

fun main() {
    val requestBody = """
        {
            "changeAddress": "addr_test1qrydyk6uw6cehk5u3zspyz3dhnwzmhfls2fp42vv5dv9g2z3885pg4kpkn30ptezc855lu3w5ey93zcr5lrezjmwkftqg8xvge",
            "outputs": [
                {
                    "address": "addr_test1qr0tkwvlln0v5fljdxceudmlpt5y6szc84vpj4skm836tgn4hsqaesgg97l8ppy5rsn0alj8pth6lqe20fdyydsdgw6sr74cyt",
                    "lovelace": 10000000
                }
            ]
        }
    """.trimIndent()

    val client = HttpClient.newHttpClient()
    val request = HttpRequest.newBuilder()
        .uri(URI.create("https://preprod.api.ada-anvil.app/v2/services/transactions/build"))
        .header("Content-Type", "application/json")
        .header("x-api-key", "testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9")
        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
        .build()

    val response = client.send(request, HttpResponse.BodyHandlers.ofString())
    println(response.body())
}

/*
{
  "hash":"7dba79edc9a29f75769fe09553134e0e8f8388f7d6e29b175b404fd2294111f1",
  "complete":"84a600d90102828258202bc2c20fa2cb1ed533dff232805f1b795f4e2d88105d847a96284abcf38c547903825820d459d2e7f42a1c75b7313fab1645a8605c9320a89c83afce2702971b5be6351c01018382583900debb399ffcdeca27f269b19e377f0ae84d40583d58195616d9e3a5a275bc01dcc1082fbe7084941c26fefe470aefaf832a7a5a42360d43b51a00989680a300581d60e442cd2e753e42e4ff226390be3156f9b64aefe9069514d7b29801e5011a001cfde0028201d8184a49616e76696c2d74616782583900c8d25b5c76b19bda9c88a0120a2dbcdc2ddd3f82921aa98ca35854285139e81456c1b4e2f0af22c1e94ff22ea648588b03a7c7914b6eb2561b000000018947f274021a00030961031a05f7c99b081a05f7ad7b0ed9010281581ce442cd2e753e42e4ff226390be3156f9b64aefe9069514d7b29801e5a100d90102818258203d01001b670ccca6335a0660ae1e4995e6e22001a7c2e2db28c6d276848eba8a5840bbc86bf73b26b7c4ed94cb493b986cc94e1694054f0dfc772844ab108b8843f4cbf9c3f3802d2ee8c1ffffb9ede62babbbc81bad177084812bc3f74c8b71c40cf5f6",
  "stripped":"84a600d90102828258202bc2c20fa2cb1ed533dff232805f1b795f4e2d88105d847a96284abcf38c547903825820d459d2e7f42a1c75b7313fab1645a8605c9320a89c83afce2702971b5be6351c01018382583900debb399ffcdeca27f269b19e377f0ae84d40583d58195616d9e3a5a275bc01dcc1082fbe7084941c26fefe470aefaf832a7a5a42360d43b51a00989680a300581d60e442cd2e753e42e4ff226390be3156f9b64aefe9069514d7b29801e5011a001cfde0028201d8184a49616e76696c2d74616782583900c8d25b5c76b19bda9c88a0120a2dbcdc2ddd3f82921aa98ca35854285139e81456c1b4e2f0af22c1e94ff22ea648588b03a7c7914b6eb2561b000000018947f274021a00030961031a05f7c99b081a05f7ad7b0ed9010281581ce442cd2e753e42e4ff226390be3156f9b64aefe9069514d7b29801e5a0f5f6",
  "witnessSet":"a100d90102818258203d01001b670ccca6335a0660ae1e4995e6e22001a7c2e2db28c6d276848eba8a5840bbc86bf73b26b7c4ed94cb493b986cc94e1694054f0dfc772844ab108b8843f4cbf9c3f3802d2ee8c1ffffb9ede62babbbc81bad177084812bc3f74c8b71c40c""
}
*/
