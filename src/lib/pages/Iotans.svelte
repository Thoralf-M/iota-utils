<script lang="ts">
    import { Transaction } from "@iota/iota-sdk/transactions";
    import JSONTree from "svelte-json-tree";
    import { getClient } from "../Client.svelte";
    import {
        isValidIotaAddress,
        toHEX,
    } from "@iota/iota-sdk/utils";
    import { type GraphQLQueryOptions, type GraphQLQueryResult, IotaGraphQLClient } from "@iota/iota-sdk/graphql";
    import { graphql } from "@iota/iota-sdk/graphql/schemas/2024.11";

    let GraphQLURL = "https://graphql.devnet.iota.cafe";
    let address =
        "0xbb9aae52e92a870876b44eab4582011070ceff28b87176529c6051f3e8e64a34";
    let domainName = "thoralf.iota";
    let IOTANS_PACKAGE_ID = "0x323b9fd87dcf0c5cbfdddeb43bf9834b4da5493246cfac2ae59e7b9b0fa62a99";
    let IOTANS_OBJECT_ID = "";
    // Will be updated with the result
    let value = {};

    const resolveAddress = async () => {
        try {
            if (IOTANS_OBJECT_ID.length == 0){
                await queryIotaNSObjectId()
            }
            const tx = new Transaction();
            let domain = tx.moveCall({
                target: `${IOTANS_PACKAGE_ID}::domain::new`,
                arguments: [
                    tx.pure.string(domainName),
                ],
            });
            let registry = tx.moveCall({
                target: `${IOTANS_PACKAGE_ID}::iotans::registry`,
                typeArguments: [`${IOTANS_PACKAGE_ID}::registry::Registry`],
                arguments: [
                    tx.sharedObjectRef({
                        objectId: IOTANS_OBJECT_ID,
                        initialSharedVersion: 1,
                        mutable: true,
                    }),
                ],
            });
            let nameRecordOption = tx.moveCall({
                target: `${IOTANS_PACKAGE_ID}::registry::lookup`,
                arguments: [
                    registry, domain,
                ],
            });
            let nameRecord = tx.moveCall({
                target: `0x1::option::borrow`,
                typeArguments: [`${IOTANS_PACKAGE_ID}::name_record::NameRecord`],
                arguments: [
                    nameRecordOption,
                ],
            });
            let targetAddressOption = tx.moveCall({
                target: `${IOTANS_PACKAGE_ID}::name_record::target_address`,
                arguments: [
                    nameRecord,
                ],
            });
           tx.moveCall({
                target: `0x1::option::borrow`,
                typeArguments: [`address`],
                arguments: [
                    targetAddressOption,
                ],
            });

            let client = await getClient();
            let txResult = await client.devInspectTransactionBlock({
                sender:  "0x0000000000000000000000000000000000000000000000000000000000000000",
                transactionBlock: tx,
            })
            console.log(txResult);
            let resolvedAddress = "0x"+toHEX(new Uint8Array(txResult.results?.pop()?.returnValues?.[0][0]!))
            console.log(resolvedAddress);
            value = resolvedAddress;
            // result = JSON.stringify(txResult, null, 2);
        } catch (err) {
            value = err.toString();
            console.error(err);
        }
    };
    const resolveName = async () => {
        try {
            if (!isValidIotaAddress(address)) {
                throw new Error("invalid address");
            }
            if (IOTANS_OBJECT_ID.length == 0){
                await queryIotaNSObjectId()
            }
            const tx = new Transaction();
                let registry = tx.moveCall({
                target: `${IOTANS_PACKAGE_ID}::iotans::registry`,
                typeArguments: [`${IOTANS_PACKAGE_ID}::registry::Registry`],
                arguments: [
                    tx.sharedObjectRef({
                        objectId: IOTANS_OBJECT_ID,
                        initialSharedVersion: 1,
                        mutable: true,
                    }),
                ],
            });
            let domainOption = tx.moveCall({
                target: `${IOTANS_PACKAGE_ID}::registry::reverse_lookup`,
                arguments: [
                    registry, tx.pure.address(address),
                ],
            });
            let domain = tx.moveCall({
                target: `0x1::option::borrow`,
                typeArguments: [`${IOTANS_PACKAGE_ID}::domain::Domain`],
                arguments: [
                    domainOption,
                ],
            });
            tx.moveCall({
                target: `${IOTANS_PACKAGE_ID}::domain::to_string`,
                arguments: [
                    domain,
                ],
            });

            let client = await getClient();
            let txResult = await client.devInspectTransactionBlock({
                sender:  "0x0000000000000000000000000000000000000000000000000000000000000000",
                transactionBlock: tx,
            })
            console.log(txResult);
            // .slice(1) to remove the length prefix
            let nameBytes = txResult.results?.pop()?.returnValues?.[0][0]!.slice(1)!
            let resolvedName = new TextDecoder().decode(new Uint8Array(nameBytes))
            console.log(resolvedName);
            value = resolvedName;
            // result = JSON.stringify(txResult, null, 2);
        } catch (err) {
            value = err.toString();
            console.error(err);
        }
    };
    async function queryIotaNSObjectId(){
        const gqlClient = new IotaGraphQLClient({
          url: "https://graphql.devnet.iota.cafe",
        });
    
        const objectQuery = `{
          objects(filter: {type: "0x323b9fd87dcf0c5cbfdddeb43bf9834b4da5493246cfac2ae59e7b9b0fa62a99::iotans::IotaNS"}) {
            edges {
              node {
                address
              }
            }
          }
        }`;
        let object: GraphQLQueryResult = await queryGraphQl(gqlClient, objectQuery, {})
        // @ts-ignore
        IOTANS_OBJECT_ID = object.data.objects.edges[0].node.address
    }
    async function queryGraphQl(gqlClient: IotaGraphQLClient, query: string, variables: Record<string, any>): Promise<GraphQLQueryResult> {
      const options: GraphQLQueryOptions = { query: graphql(query), variables };
      return gqlClient.query(options)
    };
    let showJsonTree = true;
</script>

<main>
    Default IDs are for the devnet https://api.devnet.iota.cafe with https://graphql.devnet.iota.cafe
    <br />
    <span>
        iotans package id:
        <input
            bind:value={IOTANS_PACKAGE_ID}
            placeholder="package id 0x..."
            size="67"
        />
    </span>
    <span>
        GraphQL URL:
        <input
            bind:value={GraphQLURL}
            placeholder="http://127.0.0.1:8000"
            size="67"
        />
    </span>
    <br />
    <span>
        address:
        <input
            bind:value={address}
            placeholder="address 0x..."
            size="67"
        />
    </span>
    <br />
    <span>
        domain name:
        <input
            bind:value={domainName}
            placeholder="name.iota"
        />
    </span>
    <br />

    <button on:click={() => resolveAddress()}> resolve address </button>
    <button on:click={() => resolveName()}> resolve name </button>

    <div class="value" hidden={Object.keys(value).length == 0}>
        <button on:click={() => (showJsonTree = !showJsonTree)}>
            toggle JSON tree
        </button>
        <div hidden={!showJsonTree}>
            <JSONTree {value} />
        </div>
        <pre hidden={showJsonTree}>{JSON.stringify(value, null, 2)}</pre>
    </div>
</main>

<style>
    .value,
    pre {
        text-align: left;
    }
    button {
        margin: 0.5rem;
    }
</style>
