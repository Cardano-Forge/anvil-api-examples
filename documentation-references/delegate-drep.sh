DREP_ID="drep13d6sxkyz6st9h65qqrzd8ukpywhr8swe9f6357qntgjqye0gttd"
ADDR="addr_test1qztayr885vqrx6w0j946lvtxl622flxx4asj2z4ludm3y2rewu7hmazv8tm78tvphzlream22pp6zhk0rrsa84nf6qxsrua9nh"
# See Authentication page for API key details.
X_API_KEY="CgYuz62xAS7EfM0hCP1gz1aOeHlQ4At36pGwnnLf"
API_URL="https://preprod.api.ada-anvil.app/v2/services"

curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-Api-Key: ${X_API_KEY}" \
     -d '{
           "changeAddress": "'${ADDR}'",
           "delegations": [
             {
               "type": "drep",
               "address": "'${ADDR}'",
               "keyHash": "'${DREP_ID}'"
             }
           ]
         }' \
     ${API_URL}/transactions/build
