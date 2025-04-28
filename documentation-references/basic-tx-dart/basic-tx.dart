// dart pub get
// dart run basic-tx.dart
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() async {
  await sendTransactionRequest();
}

Future<void> sendTransactionRequest() async {
  const String senderAddress =
      "addr_test1qrydyk6uw6cehk5u3zspyz3dhnwzmhfls2fp42vv5dv9g2z3885pg4kpkn30ptezc855lu3w5ey93zcr5lrezjmwkftqg8xvge";
  const String receiverAddress =
      "addr_test1qr0tkwvlln0v5fljdxceudmlpt5y6szc84vpj4skm836tgn4hsqaesgg97l8ppy5rsn0alj8pth6lqe20fdyydsdgw6sr74cyt";
  const int lovelaceAmount = 10_000_000;
  const String xApiKey = "testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9";

  final body = {
    'changeAddress': senderAddress,
    'outputs': [
      {'address': receiverAddress, 'lovelace': lovelaceAmount},
    ],
  };

  try {
    final response = await http.post(
      Uri.parse(
        'https://preprod.api.ada-anvil.app/v2/services/transactions/build',
      ),
      headers: <String, String>{
        'Content-Type': 'application/json',
        'x-api-key': xApiKey,
      },
      body: jsonEncode(body),
    );

    if (response.statusCode == 200) {
      print('Response JSON: ${jsonDecode(response.body)}');
    } else {
      print('Request failed with status: ${response.statusCode}.');
    }
  } catch (e) {
    print('An error occurred: $e');
  }
}
