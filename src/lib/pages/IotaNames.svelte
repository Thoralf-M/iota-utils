<script lang="ts">
    import { Transaction } from "@iota/iota-sdk/transactions";
    import JSONTree from "@sveltejs/svelte-json-tree";
    import { getClient, getSelectedNetwork } from "../Client.svelte";
    import { isValidIotaAddress, toHEX } from "@iota/iota-sdk/utils";
    import {
        type GraphQLQueryOptions,
        type GraphQLQueryResult,
        IotaGraphQLClient,
    } from "@iota/iota-sdk/graphql";
    import { graphql } from "@iota/iota-sdk/graphql/schemas/2024.11";

    let address =
        "0xa1a97d20bbad79e2ac89f215a3b3c4f2ff9a1aa3cc26e529bde6e7bc5500d610";
    let domainName = "iota.iota";
    let IOTA_NAMES_PACKAGE_ID =
        "0x20c890da38609db67e2713e6b33b4e4d3c6a8e9f620f9bb48f918d2337e31503";
    let IOTA_NAMES_OBJECT_ID = "";
    // Will be updated with the result
    let value = {};

    const resolveAddress = async () => {
        try {
            if (IOTA_NAMES_OBJECT_ID.length == 0) {
                await queryIotaNamesObjectId();
            }
            const tx = new Transaction();
            let domain = tx.moveCall({
                target: `${IOTA_NAMES_PACKAGE_ID}::domain::new`,
                arguments: [tx.pure.string(domainName)],
            });
            let registry = tx.moveCall({
                target: `${IOTA_NAMES_PACKAGE_ID}::iota_names::registry`,
                typeArguments: [`${IOTA_NAMES_PACKAGE_ID}::registry::Registry`],
                arguments: [
                    tx.sharedObjectRef({
                        objectId: IOTA_NAMES_OBJECT_ID,
                        initialSharedVersion: 1,
                        mutable: true,
                    }),
                ],
            });
            let nameRecordOption = tx.moveCall({
                target: `${IOTA_NAMES_PACKAGE_ID}::registry::lookup`,
                arguments: [registry, domain],
            });
            let nameRecord = tx.moveCall({
                target: `0x1::option::borrow`,
                typeArguments: [
                    `${IOTA_NAMES_PACKAGE_ID}::name_record::NameRecord`,
                ],
                arguments: [nameRecordOption],
            });
            let targetAddressOption = tx.moveCall({
                target: `${IOTA_NAMES_PACKAGE_ID}::name_record::target_address`,
                arguments: [nameRecord],
            });
            tx.moveCall({
                target: `0x1::option::borrow`,
                typeArguments: [`address`],
                arguments: [targetAddressOption],
            });

            let client = await getClient();
            let txResult = await client.devInspectTransactionBlock({
                sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
                transactionBlock: tx,
            });
            console.log(txResult);
            let resolvedAddress =
                "0x" +
                toHEX(
                    new Uint8Array(
                        txResult.results?.pop()?.returnValues?.[0][0]!,
                    ),
                );
            console.log(resolvedAddress);
            value = resolvedAddress;
            // result = JSON.stringify(txResult, null, 2);
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    };
    const resolveName = async () => {
        try {
            if (!isValidIotaAddress(address)) {
                throw new Error("invalid address");
            }
            if (IOTA_NAMES_OBJECT_ID.length == 0) {
                await queryIotaNamesObjectId();
            }
            const tx = new Transaction();
            let registry = tx.moveCall({
                target: `${IOTA_NAMES_PACKAGE_ID}::iota_names::registry`,
                typeArguments: [`${IOTA_NAMES_PACKAGE_ID}::registry::Registry`],
                arguments: [
                    tx.sharedObjectRef({
                        objectId: IOTA_NAMES_OBJECT_ID,
                        initialSharedVersion: 1,
                        mutable: true,
                    }),
                ],
            });
            let domainOption = tx.moveCall({
                target: `${IOTA_NAMES_PACKAGE_ID}::registry::reverse_lookup`,
                arguments: [registry, tx.pure.address(address)],
            });
            let domain = tx.moveCall({
                target: `0x1::option::borrow`,
                typeArguments: [`${IOTA_NAMES_PACKAGE_ID}::domain::Domain`],
                arguments: [domainOption],
            });
            tx.moveCall({
                target: `${IOTA_NAMES_PACKAGE_ID}::domain::to_string`,
                arguments: [domain],
            });

            let client = await getClient();
            let txResult = await client.devInspectTransactionBlock({
                sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
                transactionBlock: tx,
            });
            console.log(txResult);
            // .slice(1) to remove the length prefix
            let nameBytes = txResult.results
                ?.pop()
                ?.returnValues?.[0][0]!.slice(1)!;
            let resolvedName = new TextDecoder().decode(
                new Uint8Array(nameBytes),
            );
            console.log(resolvedName);
            value = resolvedName;
            // result = JSON.stringify(txResult, null, 2);
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    };
    async function queryIotaNamesObjectId() {
        const gqlClient = new IotaGraphQLClient({
            url: getSelectedNetwork().graphql,
        });

        const objectQuery = `{
          objects(filter: {type: "${IOTA_NAMES_PACKAGE_ID}::iota_names::IotaNames"}) {
            edges {
              node {
                address
              }
            }
          }
        }`;
        let object: GraphQLQueryResult = await queryGraphQl(
            gqlClient,
            objectQuery,
            {},
        );
        // @ts-ignore
        IOTA_NAMES_OBJECT_ID = object.data.objects.edges[0].node.address;
    }
    async function queryGraphQl(
        gqlClient: IotaGraphQLClient,
        query: string,
        variables: Record<string, any>,
    ): Promise<GraphQLQueryResult> {
        const options: GraphQLQueryOptions = {
            query: graphql(query),
            variables,
        };
        return gqlClient.query(options);
    }
    async function getRegisteredNames() {
        try {
            const gqlClient = new IotaGraphQLClient({
                url: getSelectedNetwork().graphql,
            });

            let dynamicFields = await queryDynamicFields();
            let registration =
                // @ts-ignore
                dynamicFields.data.owner.dynamicFields.nodes.find(
                    (v: any) =>
                        v.name.type.repr ==
                        `${IOTA_NAMES_PACKAGE_ID}::iota_names::RegistryKey<${IOTA_NAMES_PACKAGE_ID}::registry::Registry>`,
                );
            let registryId = registration.value.json.registry.id;

            let query = `query ($address: IotaAddress) {
                owner(address: $address) {
                    dynamicFields {
                        nodes {
                            name {
                                json
                            }
                            value {
                                ... on MoveValue {
                                    json
                                }
                            }
                        }
                    }
                }
            }`;

            let object: GraphQLQueryResult = await queryGraphQl(
                gqlClient,
                query,
                {
                    address: registryId,
                },
            );

            let res = {};
            // @ts-ignore
            res.total = object.data.owner.dynamicFields.nodes.length;
            // @ts-ignore
            res.names = object.data.owner.dynamicFields.nodes.map((v) =>
                v.name.json.labels.reverse().join("."),
            );
            // @ts-ignore
            res.registrations = object.data.owner.dynamicFields.nodes;
            value = res;
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    async function getReverseRegisteredAddresses() {
        try {
            const gqlClient = new IotaGraphQLClient({
                url: getSelectedNetwork().graphql,
            });

            let dynamicFields = await queryDynamicFields();
            let registration =
                // @ts-ignore
                dynamicFields.data.owner.dynamicFields.nodes.find(
                    (v: any) =>
                        v.name.type.repr ==
                        `${IOTA_NAMES_PACKAGE_ID}::iota_names::RegistryKey<${IOTA_NAMES_PACKAGE_ID}::registry::Registry>`,
                );
            let reverseRegistryId = registration.value.json.reverse_registry.id;

            let query = `query ($address: IotaAddress) {
                owner(address: $address) {
                    dynamicFields {
                        nodes {
                            name {
                                json
                            }
                            value {
                                ... on MoveValue {
                                    json
                                }
                            }
                        }
                    }
                }
            }`;

            let object: GraphQLQueryResult = await queryGraphQl(
                gqlClient,
                query,
                {
                    address: reverseRegistryId,
                },
            );

            let res = {};
            // @ts-ignore
            res.total = object.data.owner.dynamicFields.nodes.length;
            // @ts-ignore
            res.reverseRegistry = object.data.owner.dynamicFields.nodes.map(
                (v: any) => {
                    return {
                        address: v.name.json,
                        name: v.value.json.labels.reverse().join("."),
                    };
                },
            );
            value = res;
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    async function getDynamicFields() {
        try {
            value = await queryDynamicFields();
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    async function queryDynamicFields(): Promise<GraphQLQueryResult> {
        const gqlClient = new IotaGraphQLClient({
            url: getSelectedNetwork().graphql,
        });

        if (IOTA_NAMES_OBJECT_ID.length == 0) {
            await queryIotaNamesObjectId();
        }

        const objectQuery = `query ($address: IotaAddress!) {
                owner(address: $address) {
                    dynamicFields {
                    nodes {
                        name { type {
                                repr
                        } }
                        value {
                        ... on MoveValue {
                            json
                        }
                        }
                    }
                    }
                }
            }`;
        let dynamicFields: any = await queryGraphQl(gqlClient, objectQuery, {
            address: IOTA_NAMES_OBJECT_ID,
        });
        return dynamicFields;
    }
    let showJsonTree = false;
</script>

<main>
    Default ID is for the devnet
    <br />
    <span>
        IotaNames package id:
        <input
            bind:value={IOTA_NAMES_PACKAGE_ID}
            onchange={() => {
                IOTA_NAMES_OBJECT_ID = "";
            }}
            placeholder="package id 0x..."
            size="67"
        />
    </span>
    <br />
    <span>
        address:
        <input bind:value={address} placeholder="address 0x..." size="67" />
    </span>
    <br />
    <span>
        domain name:
        <input bind:value={domainName} placeholder="name.iota" />
    </span>
    <br />

    {#if IOTA_NAMES_OBJECT_ID.length != 0}
        IotaNames Object ID: {IOTA_NAMES_OBJECT_ID}
        <br />
    {/if}

    <button onclick={resolveAddress}> resolve address </button>
    <button onclick={resolveName}> resolve name </button>
    <button onclick={getRegisteredNames}> get registered names </button>
    <button onclick={getReverseRegisteredAddresses}>
        get reverse registered addresses
    </button>
    <button onclick={getDynamicFields}> get dynamic fields </button>

    <div class="value" hidden={Object.keys(value).length == 0}>
        <button onclick={() => (showJsonTree = !showJsonTree)}>
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
