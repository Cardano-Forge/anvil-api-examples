import { API_URL, HEADERS } from "../utils/constant.ts";

const CHANGE_ADDRESS =
  "addr_test1qra369fzgacfz9edsnel4kcpx8r9d7dqc8rfhvqmpajzn6pu8sm3t2e5gfnfsn7328k0rtde0yytk7gnjaau45z2cl6q0pxm0c";

const asset = {
  metadata: {
    name: "Placeholder",
    image: [
      "https://ada-anvil.s3.ca-central-1.amazonaws.com/",
      "logo_pres_V2_3.png",
    ],
    mediaType: "image/png",
    description: "Testing CIP-25 using anvil API",
    // Adding custom data just to test the flow
  },
};

const data = {
  meta: [
    {
      label: "token",
      data: {
        policyId_placeholder: {
          "Placeholder label token": {
            ...asset.metadata,
            name: "Placeholder label token",
          },
        },
      },
    },
    {
      label: 721,
      data: {
        policyId_placeholder: {
          "Placeholder label 721": {
            ...asset.metadata,
            name: "Placeholder label 721",
          },
        },
      },
    },
    {
      data: {
        721: {
          policyId_placeholder: {
            "Placeholder no label": {
              ...asset.metadata,
              name: "Placeholder no label",
            },
          },
        },
      },
    },
  ],
  changeAddress: CHANGE_ADDRESS,
};

const urlTX = `${API_URL}/transactions/build`;
const transactionTestingMeta = await fetch(urlTX, {
  method: "POST",
  body: JSON.stringify(data),
  headers: HEADERS,
});

console.log(await transactionTestingMeta.json());

// Expected Output:
// {
//   hash: "a79f6bb294684e636e5b3a841cbe3d533d6157d0f68eb3343e155194edb7520c",
//   complete: "84a700d901028282582092b04cd65db941cd08d538ac73e01904023ba1685b894ba7ff6ee00ed7a188a100825820fd2e7c9f91419e78b0a95f48e6e87d256dc1c61d3b98363bfcb87613c08c7cea010182a300581d60838f5d45dcd53854a214d717e5941e62e3b001dbb29b87a4dbcf9ab9011a00155cc0028201d8184a49616e76696c2d74616782583900fb1d1522477091172d84f3fadb0131c656f9a0c1c69bb01b0f6429e83c3c3715ab344266984fd151ecf1adb97908bb7913977bcad04ac7f41a012ab56f021a00036a51031a05221699075820f20462e073ce6fb40c792707c592af92314938d3c428fb13c6faf3fbb3c95887081a0521fa790ed9010281581c838f5d45dcd53854a214d717e5941e62e3b001dbb29b87a4dbcf9ab9a100d9010281825820b5c1c82b5f5bcec6e8d053d7eeb0fe4aa1009561690c0af53c0804cb59d2c0295840875122318d61ff8173ef55ea6fce1b269ef6b7aeee688bf66ad7ccb58a5edb2cb0428ed52b75311b86b335f62d04a75175bc9134bc4636084f8669b8e0dfb503f5a11902d1a174706f6c69637949645f706c616365686f6c646572a375506c616365686f6c646572206c6162656c20373231a46b6465736372697074696f6e781e54657374696e67204349502d3235207573696e6720616e76696c2041504965696d61676582783068747470733a2f2f6164612d616e76696c2e73332e63612d63656e7472616c2d312e616d617a6f6e6177732e636f6d2f726c6f676f5f707265735f56325f332e706e67696d656469615479706569696d6167652f706e67646e616d6575506c616365686f6c646572206c6162656c2037323177506c616365686f6c646572206c6162656c20746f6b656ea46b6465736372697074696f6e781e54657374696e67204349502d3235207573696e6720616e76696c2041504965696d61676582783068747470733a2f2f6164612d616e76696c2e73332e63612d63656e7472616c2d312e616d617a6f6e6177732e636f6d2f726c6f676f5f707265735f56325f332e706e67696d656469615479706569696d6167652f706e67646e616d6577506c616365686f6c646572206c6162656c20746f6b656e74506c616365686f6c646572206e6f206c6162656ca46b6465736372697074696f6e781e54657374696e67204349502d3235207573696e6720616e76696c2041504965696d61676582783068747470733a2f2f6164612d616e76696c2e73332e63612d63656e7472616c2d312e616d617a6f6e6177732e636f6d2f726c6f676f5f707265735f56325f332e706e67696d656469615479706569696d6167652f706e67646e616d6574506c616365686f6c646572206e6f206c6162656c",
//   stripped: "84a700d901028282582092b04cd65db941cd08d538ac73e01904023ba1685b894ba7ff6ee00ed7a188a100825820fd2e7c9f91419e78b0a95f48e6e87d256dc1c61d3b98363bfcb87613c08c7cea010182a300581d60838f5d45dcd53854a214d717e5941e62e3b001dbb29b87a4dbcf9ab9011a00155cc0028201d8184a49616e76696c2d74616782583900fb1d1522477091172d84f3fadb0131c656f9a0c1c69bb01b0f6429e83c3c3715ab344266984fd151ecf1adb97908bb7913977bcad04ac7f41a012ab56f021a00036a51031a05221699075820f20462e073ce6fb40c792707c592af92314938d3c428fb13c6faf3fbb3c95887081a0521fa790ed9010281581c838f5d45dcd53854a214d717e5941e62e3b001dbb29b87a4dbcf9ab9a0f5f6",
//   witnessSet: "a100d9010281825820b5c1c82b5f5bcec6e8d053d7eeb0fe4aa1009561690c0af53c0804cb59d2c0295840875122318d61ff8173ef55ea6fce1b269ef6b7aeee688bf66ad7ccb58a5edb2cb0428ed52b75311b86b335f62d04a75175bc9134bc4636084f8669b8e0dfb503",
//   auxiliaryData: "a11902d1a174706f6c69637949645f706c616365686f6c646572a375506c616365686f6c646572206c6162656c20373231a46b6465736372697074696f6e781e54657374696e67204349502d3235207573696e6720616e76696c2041504965696d61676582783068747470733a2f2f6164612d616e76696c2e73332e63612d63656e7472616c2d312e616d617a6f6e6177732e636f6d2f726c6f676f5f707265735f56325f332e706e67696d656469615479706569696d6167652f706e67646e616d6575506c616365686f6c646572206c6162656c2037323177506c616365686f6c646572206c6162656c20746f6b656ea46b6465736372697074696f6e781e54657374696e67204349502d3235207573696e6720616e76696c2041504965696d61676582783068747470733a2f2f6164612d616e76696c2e73332e63612d63656e7472616c2d312e616d617a6f6e6177732e636f6d2f726c6f676f5f707265735f56325f332e706e67696d656469615479706569696d6167652f706e67646e616d6577506c616365686f6c646572206c6162656c20746f6b656e74506c616365686f6c646572206e6f206c6162656ca46b6465736372697074696f6e781e54657374696e67204349502d3235207573696e6720616e76696c2041504965696d61676582783068747470733a2f2f6164612d616e76696c2e73332e63612d63656e7472616c2d312e616d617a6f6e6177732e636f6d2f726c6f676f5f707265735f56325f332e706e67696d656469615479706569696d6167652f706e67646e616d6574506c616365686f6c646572206e6f206c6162656c"
// }
