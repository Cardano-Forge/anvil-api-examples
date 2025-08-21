// To compile and run:
// swift basic-tx.swift

import Foundation
// On Linux, URLRequest and URLSession are in FoundationNetworking module
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

let requestBody = """
{
    "changeAddress": "addr_test1qrydyk6uw6cehk5u3zspyz3dhnwzmhfls2fp42vv5dv9g2z3885pg4kpkn30ptezc855lu3w5ey93zcr5lrezjmwkftqg8xvge",
    "outputs": [
        {
            "address": "addr_test1qr0tkwvlln0v5fljdxceudmlpt5y6szc84vpj4skm836tgn4hsqaesgg97l8ppy5rsn0alj8pth6lqe20fdyydsdgw6sr74cyt",
            "lovelace": 10000000
        }
    ]
}
"""

let url = URL(string: "https://preprod.api.ada-anvil.app/v2/services/transactions/build")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.setValue("testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9", forHTTPHeaderField: "x-api-key")
request.httpBody = requestBody.data(using: .utf8)

let semaphore = DispatchSemaphore(value: 0)

URLSession.shared.dataTask(with: request) { data, response, error in
    if let data = data, let responseString = String(data: data, encoding: .utf8) {
        print(responseString)
    }
    semaphore.signal()
}.resume()

semaphore.wait()

/*
{
"hash":"144b70c1b2a09e5dbeb472bed588d16d1e461ecd907897b4c3d30cb8ba9fdedb",
"complete":"84a600d90102828258202bc2c20fa2cb1ed533dff232805f1b795f4e2d88105d847a96284abcf38c547903825820e13ec60036f7d44e7b0fa8afffa7fa3c4a39d7b03c3b688bae1e6267d10d388401018382583900debb399ffcdeca27f269b19e377f0ae84d40583d58195616d9e3a5a275bc01dcc1082fbe7084941c26fefe470aefaf832a7a5a42360d43b51a00989680a300581d602ceb80993b88b06025914592e85ed47b1ef837de3aadf42ef3406791011a00186a00028201d8184a49616e76696c2d74616782583900c8d25b5c76b19bda9c88a0120a2dbcdc2ddd3f82921aa98ca35854285139e81456c1b4e2f0af22c1e94ff22ea648588b03a7c7914b6eb2561b000000018947f274021a00030961031a05f7d9a0081a05f7bd800ed9010281581c2ceb80993b88b06025914592e85ed47b1ef837de3aadf42ef3406791a100d9010281825820100055cf8df683f7986db463f1ce9a939305390386eea837fdabed4088502b8c58404c5952d6f86107da2a2d30062c9ab353f333ef500405a09bda983dd178e4483132999f850c69931e5cb97aa5886d3dd2eff2e2e0a84bd02d9ebc50566936850df5f6",
"stripped":"84a600d90102828258202bc2c20fa2cb1ed533dff232805f1b795f4e2d88105d847a96284abcf38c547903825820e13ec60036f7d44e7b0fa8afffa7fa3c4a39d7b03c3b688bae1e6267d10d388401018382583900debb399ffcdeca27f269b19e377f0ae84d40583d58195616d9e3a5a275bc01dcc1082fbe7084941c26fefe470aefaf832a7a5a42360d43b51a00989680a300581d602ceb80993b88b06025914592e85ed47b1ef837de3aadf42ef3406791011a00186a00028201d8184a49616e76696c2d74616782583900c8d25b5c76b19bda9c88a0120a2dbcdc2ddd3f82921aa98ca35854285139e81456c1b4e2f0af22c1e94ff22ea648588b03a7c7914b6eb2561b000000018947f274021a00030961031a05f7d9a0081a05f7bd800ed9010281581c2ceb80993b88b06025914592e85ed47b1ef837de3aadf42ef3406791a0f5f6",
"witnessSet":"a100d9010281825820100055cf8df683f7986db463f1ce9a939305390386eea837fdabed4088502b8c58404c5952d6f86107da2a2d30062c9ab353f333ef500405a09bda983dd178e4483132999f850c69931e5cb97aa5886d3dd2eff2e2e0a84bd02d9ebc50566936850d"
}
*/