// dotnet new console -n BasicTx --force && cd BasicTx
// Replace Program.cs content with this file, then: dotnet run

using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

public class BasicTx
{
    public static async Task Main(string[] args)
    {
        string requestBody = @"{
            ""changeAddress"": ""addr_test1qrydyk6uw6cehk5u3zspyz3dhnwzmhfls2fp42vv5dv9g2z3885pg4kpkn30ptezc855lu3w5ey93zcr5lrezjmwkftqg8xvge"",
            ""outputs"": [
                {
                    ""address"": ""addr_test1qr0tkwvlln0v5fljdxceudmlpt5y6szc84vpj4skm836tgn4hsqaesgg97l8ppy5rsn0alj8pth6lqe20fdyydsdgw6sr74cyt"",
                    ""lovelace"": 10000000
                }
            ]
        }";

        using var client = new HttpClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://preprod.api.ada-anvil.app/v2/services/transactions/build");
        request.Headers.Add("x-api-key", "testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9");
        request.Content = new StringContent(requestBody, Encoding.UTF8, "application/json");

        using var response = await client.SendAsync(request);
        string responseContent = await response.Content.ReadAsStringAsync();
        Console.WriteLine(responseContent);
    }
}

/*
{
"hash":"091fd2a199d5c6770923e5ff1fdd281cb40430c0fc7ad3d401998f0cdc91aa1b",
"complete":"84a600d901028282582018a93dcbc896f6a159c9a0feb96b5dc0df19017f60fd2b695e2adf0344da0625018258202bc2c20fa2cb1ed533dff232805f1b795f4e2d88105d847a96284abcf38c547903018382583900debb399ffcdeca27f269b19e377f0ae84d40583d58195616d9e3a5a275bc01dcc1082fbe7084941c26fefe470aefaf832a7a5a42360d43b51a00989680a300581d60c1a9e90adb24b9670f171d8fc38c029de42e5d081bd7142ebd54d699011a00186a00028201d8184a49616e76696c2d74616782583900c8d25b5c76b19bda9c88a0120a2dbcdc2ddd3f82921aa98ca35854285139e81456c1b4e2f0af22c1e94ff22ea648588b03a7c7914b6eb2561b000000018947f274021a00030961031a05f7c598081a05f7a9780ed9010281581cc1a9e90adb24b9670f171d8fc38c029de42e5d081bd7142ebd54d699a100d9010281825820611bd4b7fb0e1609614dfb1fcf6f20718235b8e0dbd00702b5050f2a521040825840e1103d0597a30f5b6a213490b7589d76c84b9144188430c36aae4ad2b113052e0def42bb207020cff35572034a97dd89b9492abd01e378459121df626bf2db09f5f6",
"stripped":"84a600d901028282582018a93dcbc896f6a159c9a0feb96b5dc0df19017f60fd2b695e2adf0344da0625018258202bc2c20fa2cb1ed533dff232805f1b795f4e2d88105d847a96284abcf38c547903018382583900debb399ffcdeca27f269b19e377f0ae84d40583d58195616d9e3a5a275bc01dcc1082fbe7084941c26fefe470aefaf832a7a5a42360d43b51a00989680a300581d60c1a9e90adb24b9670f171d8fc38c029de42e5d081bd7142ebd54d699011a00186a00028201d8184a49616e76696c2d74616782583900c8d25b5c76b19bda9c88a0120a2dbcdc2ddd3f82921aa98ca35854285139e81456c1b4e2f0af22c1e94ff22ea648588b03a7c7914b6eb2561b000000018947f274021a00030961031a05f7c598081a05f7a9780ed9010281581cc1a9e90adb24b9670f171d8fc38c029de42e5d081bd7142ebd54d699a0f5f6",
"witnessSet":"a100d9010281825820611bd4b7fb0e1609614dfb1fcf6f20718235b8e0dbd00702b5050f2a521040825840e1103d0597a30f5b6a213490b7589d76c84b9144188430c36aae4ad2b113052e0def42bb207020cff35572034a97dd89b9492abd01e378459121df626bf2db09"
}
*/