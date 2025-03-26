<script lang="ts">
    import { Transaction } from "@iota/iota-sdk/transactions";
    import JSONTree from "@sveltejs/svelte-json-tree";
    import { getClient, getSelectedNetwork } from "../Client.svelte";
    import {
        IOTA_CLOCK_OBJECT_ID,
        isValidIotaAddress,
        toHEX,
    } from "@iota/iota-sdk/utils";
    import {
        type GraphQLQueryOptions,
        type GraphQLQueryResult,
        IotaGraphQLClient,
    } from "@iota/iota-sdk/graphql";
    import { graphql } from "@iota/iota-sdk/graphql/schemas/2024.11";
    import {
        activeAddress,
        iota_accounts,
        iota_wallets,
    } from "../SignerData.svelte";

    let address =
        "0xa1a97d20bbad79e2ac89f215a3b3c4f2ff9a1aa3cc26e529bde6e7bc5500d610";
    let domainName = "name.iota";
    let years = 1;
    let bidPrice = 10000000;
    let IOTA_NAMES_PACKAGE_ID =
        "0xa1d2ed2008d31d358cfaf61a89aa7cfaa78ed183dbe683620258e98c59f48b13";
    let AUCTION_PACKAGE_ID = "";
    let AUCTION_HOUSE_OBJECT_ID = "";
    let PAYMENTS_PACKAGE_ID = "";
    let SUBDOMAIN_PACKAGE_ID = "";
    let IOTA_NAMES_OBJECT_ID = "";
    let SUBDOMAIN_PROXY_PACKAGE_ID = "";
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
    async function queryAuctionObjectId() {
        const gqlClient = new IotaGraphQLClient({
            url: getSelectedNetwork().graphql,
        });

        const objectQuery = `{
          objects(filter: {type: "${AUCTION_PACKAGE_ID}::auction::AuctionHouse"}) {
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
        AUCTION_HOUSE_OBJECT_ID = object.data.objects.edges[0].node.address;
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
    async function getRegisteredNamesInner(
        showResult?: boolean,
    ): Promise<object> {
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

        let res = { total: 0, names: [], registrations: [] };

        let cursorSection = "";
        while (true) {
            let query = `query ($address: IotaAddress) {
                owner(address: $address) {
                    dynamicFields${cursorSection} {
                        pageInfo{
                            hasNextPage
                            endCursor
                        }
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

            if (object.errors) {
                break;
            }
            // @ts-ignore
            res.total += object.data.owner.dynamicFields.nodes.length;
            res.names.push(
                // @ts-ignore
                ...object.data.owner.dynamicFields.nodes.map((v) =>
                    v.name.json.labels.reverse().join("."),
                ),
            );
            // @ts-ignore
            res.registrations.push(...object.data.owner.dynamicFields.nodes);

            if (showResult) {
                value = res;
            }
            // @ts-ignore
            if (object.data.owner.dynamicFields.pageInfo.hasNextPage) {
                // @ts-ignore
                cursorSection = `(after: "${object.data.owner.dynamicFields.pageInfo.endCursor}")`;
            } else {
                break;
            }
        }

        return res;
    }
    async function getRegisteredNames() {
        try {
            await getRegisteredNamesInner(true);
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
    async function getPackageIds() {
        try {
            // @ts-ignore
            let dynamicFields = (await queryDynamicFields()).data.owner
                .dynamicFields.nodes;
            // Don't want to fail everything if auction is not existing
            try {
                AUCTION_PACKAGE_ID = parsePackageId(
                    "auction::App",
                    dynamicFields,
                );
            } catch (e) {
                console.error(e);
            }
            PAYMENTS_PACKAGE_ID = parsePackageId(
                "payments::PaymentsConfig",
                dynamicFields,
            );
            SUBDOMAIN_PACKAGE_ID = parsePackageId(
                "subdomains::SubDomains",
                dynamicFields,
            );

            await getSubDomainProxyPackageId();

            function parsePackageId(
                moduleStruct: string,
                dynamicFields: object[],
            ): string {
                return dynamicFields
                    .filter((d: any) => d.name.type.repr.includes(moduleStruct))
                    .map((d: any) => {
                        let type: string = d.name.type.repr;
                        let index = type.indexOf("<");
                        return type.slice(index + 1, index + 67);
                    })[0];
            }
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    async function registerName() {
        try {
            await getPackageIds();
            let dynamicFields = await queryDynamicFields();
            let priceConfig =
                // @ts-ignore
                dynamicFields.data.owner.dynamicFields.nodes.filter((d: any) =>
                    d.name.type.repr.includes("pricing_config::PricingConfig"),
                )[0].value.json;
            let domainLabels = domainName.split(".");
            let length = domainLabels[0].length;
            if (length < 3) {
                throw new Error("name too short (minimum 3 characters)");
            }
            let price = 0;
            for (const pricing of priceConfig.pricing.contents) {
                if (
                    length >= parseInt(pricing.key.pos0) &&
                    length <= parseInt(pricing.key.pos1)
                ) {
                    price = pricing.value;
                    break;
                }
            }
            let tx = new Transaction();
            if (domainLabels.length == 2) {
                const paymentIntent = tx.moveCall({
                    target: `${IOTA_NAMES_PACKAGE_ID}::payment::init_registration`,
                    arguments: [
                        tx.object(IOTA_NAMES_OBJECT_ID),
                        tx.pure.string(domainName),
                    ],
                });

                const payment = tx.splitCoins(tx.gas, [price]);
                const receipt = tx.moveCall({
                    target: `${PAYMENTS_PACKAGE_ID}::payments::handle_base_payment`,
                    arguments: [
                        tx.object(IOTA_NAMES_OBJECT_ID),
                        paymentIntent,
                        payment,
                    ],
                    typeArguments: [
                        "0x0000000000000000000000000000000000000000000000000000000000000002::iota::IOTA",
                    ],
                });
                const nft = tx.moveCall({
                    target: `${IOTA_NAMES_PACKAGE_ID}::payment::register`,
                    arguments: [
                        receipt,
                        tx.object(IOTA_NAMES_OBJECT_ID),
                        tx.object(IOTA_CLOCK_OBJECT_ID),
                    ],
                });
                tx.transferObjects([nft], tx.pure.address($activeAddress));
            } else {
                // Subdomains
                let isParentSubdomain = domainLabels.length > 3;
                domainLabels.shift();
                let parentDomainName = domainLabels.join(".")!;
                let parentNft = await getNft(parentDomainName);

                let expirationNextMonthTimestampMs =
                    Date.now() + 1000 * 60 * 60 * 24 * 30;

                if (isParentSubdomain) {
                    // parent NFT is wrapped in Subdomain NFT, so the subdomain NFT must be provided
                    const client = await getClient();
                    const outputs = await client.getOwnedObjects({
                        owner: $activeAddress,
                        options: { showContent: true, showType: true },
                    });
                    // Find the output that contains the parentNft id
                    const subdomainOutputs = outputs.data.filter((output) =>
                        // @ts-ignore
                        output.data.content.type.includes(
                            "SubDomainRegistration",
                        ),
                    );
                    let subdomainNft = subdomainOutputs.find(
                        (e) =>
                            // @ts-ignore
                            e.data.content.fields.nft.fields.domain_name ==
                            parentDomainName,
                    );
                    parentNft = subdomainNft?.data?.objectId!;
                    // Expiration time can be at most the same as the parent
                    expirationNextMonthTimestampMs =
                        // @ts-ignore
                        subdomainNft.data.content.fields.nft.fields
                            .expiration_timestamp_ms;
                }

                let allowChildCreation = true;
                let allowTimeExtension = true;
                const subNft = tx.moveCall({
                    target: isParentSubdomain
                        ? `${SUBDOMAIN_PROXY_PACKAGE_ID}::subdomain_proxy::new`
                        : `${SUBDOMAIN_PACKAGE_ID}::subdomains::new`,
                    arguments: [
                        tx.object(IOTA_NAMES_OBJECT_ID),
                        tx.object(parentNft),
                        tx.object(IOTA_CLOCK_OBJECT_ID),
                        tx.pure.string(domainName),
                        tx.pure.u64(expirationNextMonthTimestampMs),
                        tx.pure.bool(allowChildCreation),
                        tx.pure.bool(allowTimeExtension),
                    ],
                });
                tx.transferObjects([subNft], tx.pure.address($activeAddress));
            }

            // @ts-ignore
            let txResult = await $iota_wallets[0].signAndExecuteTransaction({
                transaction: tx,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
                account: $iota_accounts.filter(
                    (account) => account.address == $activeAddress,
                )[0],
            });
            value = txResult;
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    async function setTargetAddress() {
        try {
            await getPackageIds();

            let registered = await getRegisteredNamesInner();
            // @ts-ignore
            let registrationIndex = registered.registrations.findIndex(
                (e: any) => e.name.json.labels.join(".") == domainName,
            );
            if (registrationIndex == -1) {
                throw new Error("domain name not found");
            }
            let nft_id =
                // @ts-ignore
                registered.registrations[registrationIndex].value.json.nft_id;

            let tx = new Transaction();
            tx.moveCall({
                target: `${IOTA_NAMES_PACKAGE_ID}::controller::set_target_address`,
                arguments: [
                    tx.object(IOTA_NAMES_OBJECT_ID),
                    tx.object(nft_id),
                    tx.pure.option("address", address),
                    tx.object("0x6"),
                ],
            });

            // @ts-ignore
            let txResult = await $iota_wallets[0].signAndExecuteTransaction({
                transaction: tx,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
                account: $iota_accounts.filter(
                    (account) => account.address == $activeAddress,
                )[0],
            });
            value = txResult;
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    async function getNft(domainName: string): Promise<string> {
        let registered = await getRegisteredNamesInner();
        // @ts-ignore
        let registrationIndex = registered.registrations.findIndex(
            (e: any) => e.name.json.labels.join(".") == domainName,
        );
        if (registrationIndex == -1) {
            throw new Error("domain name not found");
        }
        // @ts-ignore
        return registered.registrations[registrationIndex].value.json.nft_id;
    }
    async function setReverseLookup() {
        try {
            await getPackageIds();

            let tx = new Transaction();
            tx.moveCall({
                target: `${IOTA_NAMES_PACKAGE_ID}::controller::set_reverse_lookup`,
                arguments: [
                    tx.object(IOTA_NAMES_OBJECT_ID),
                    tx.pure.string(domainName),
                ],
            });

            // @ts-ignore
            let txResult = await $iota_wallets[0].signAndExecuteTransaction({
                transaction: tx,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
                account: $iota_accounts.filter(
                    (account) => account.address == $activeAddress,
                )[0],
            });
            value = txResult;
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    async function getSubDomainProxyPackageId() {
        let client = await getClient();
        let iotaNamesPackageObject = await client.getObject({
            id: IOTA_NAMES_PACKAGE_ID,
            options: { showPreviousTransaction: true },
        });
        let publishTx = await client.getTransactionBlock({
            digest: iotaNamesPackageObject.data?.previousTransaction!,
        });

        const gqlClient = new IotaGraphQLClient({
            url: getSelectedNetwork().graphql,
        });
        // This assumes that the subdomain_proxy package was published right afterwards
        const objectQuery = `{
            packages(filter: {afterCheckpoint: ${publishTx.checkpoint}}) {
                nodes {
                    address
                        latestPackage {
                            modules {
                                nodes {
                                    name
                                    functions {
                                        nodes {
                                          name
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }`;
        let publishedPackages: any = await queryGraphQl(
            gqlClient,
            objectQuery,
            {},
        );
        let subdomainProxyPackage =
            publishedPackages.data.packages.nodes.filter(
                (e: any) =>
                    e.latestPackage.modules.nodes[0].name == "subdomain_proxy",
            )[0];
        SUBDOMAIN_PROXY_PACKAGE_ID = subdomainProxyPackage.address;
    }
    async function startAuctionAndPlaceBid() {
        try {
            await getPackageIds();
            await queryAuctionObjectId();
            let domainLabels = domainName.split(".");
            if (domainLabels.length != 2) {
                throw new Error(
                    "can only start an auction for domains with 2 labels (name.iota)",
                );
            }

            let tx = new Transaction();
            const payment = tx.splitCoins(tx.gas, [bidPrice]);
            tx.moveCall({
                target: `${AUCTION_PACKAGE_ID}::auction::start_auction_and_place_bid`,
                arguments: [
                    tx.object(AUCTION_HOUSE_OBJECT_ID),
                    tx.object(IOTA_NAMES_OBJECT_ID),
                    tx.pure.string(domainName),
                    payment,
                    tx.object("0x6"),
                ],
            });

            // @ts-ignore
            let txResult = await $iota_wallets[0].signAndExecuteTransaction({
                transaction: tx,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
                account: $iota_accounts.filter(
                    (account) => account.address == $activeAddress,
                )[0],
            });
            value = txResult;
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    async function placeBid() {
        try {
            await getPackageIds();
            await queryAuctionObjectId();
            let domainLabels = domainName.split(".");
            if (domainLabels.length != 2) {
                throw new Error(
                    "can only bid for domains with 2 labels (name.iota)",
                );
            }

            let tx = new Transaction();
            const payment = tx.splitCoins(tx.gas, [bidPrice]);
            tx.moveCall({
                target: `${AUCTION_PACKAGE_ID}::auction::place_bid`,
                arguments: [
                    tx.object(AUCTION_HOUSE_OBJECT_ID),
                    tx.pure.string(domainName),
                    payment,
                    tx.object("0x6"),
                ],
            });

            // @ts-ignore
            let txResult = await $iota_wallets[0].signAndExecuteTransaction({
                transaction: tx,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
                account: $iota_accounts.filter(
                    (account) => account.address == $activeAddress,
                )[0],
            });
            value = txResult;
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    async function claim() {
        try {
            await getPackageIds();
            await queryAuctionObjectId();
            let domainLabels = domainName.split(".");
            if (domainLabels.length != 2) {
                throw new Error(
                    "can only claim domains with 2 labels (name.iota)",
                );
            }

            let tx = new Transaction();
            let nft = tx.moveCall({
                target: `${AUCTION_PACKAGE_ID}::auction::claim`,
                arguments: [
                    tx.object(AUCTION_HOUSE_OBJECT_ID),
                    tx.pure.string(domainName),
                    tx.object("0x6"),
                ],
            });
            tx.transferObjects([nft], tx.pure.address($activeAddress));

            // @ts-ignore
            let txResult = await $iota_wallets[0].signAndExecuteTransaction({
                transaction: tx,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
                account: $iota_accounts.filter(
                    (account) => account.address == $activeAddress,
                )[0],
            });
            value = txResult;
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    async function getAuctions() {
        try {
            await getPackageIds();
            await queryAuctionObjectId();
            let client = await getClient();
            let object = await client.getObject({
                id: AUCTION_HOUSE_OBJECT_ID,
                options: { showContent: true, showPreviousTransaction: true },
            });
            let res: any = {
                objectId: "",
                previousTransaction: "",
                balance: 0,
                auctionNames: [],
                unclaimedAuctionNames: [],
                auctions: [],
                unclaimedAuctions: [],
            };
            res.objectId = object.data?.objectId;
            res.previousTransaction = object.data?.previousTransaction;
            // @ts-ignore
            res.balance = object.data?.content?.fields?.balance;
            let linked_table_id =
                // @ts-ignore
                object.data.content.fields.auctions.fields.id.id;

            const gqlClient = new IotaGraphQLClient({
                url: getSelectedNetwork().graphql,
            });
            let cursorSection = "";
            while (true) {
                let query = `{
                    owner(
                        address: "${linked_table_id}"
                    ) {
                        dynamicFields${cursorSection} {
                            pageInfo{
                                hasNextPage
                                endCursor
                            }
                            nodes {
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
                        address: IOTA_NAMES_OBJECT_ID,
                    },
                );

                if (object.errors) {
                    break;
                }
                let now = new Date().getTime();
                // @ts-ignore
                for (let auctionNode of object.data.owner.dynamicFields.nodes) {
                    // @ts-ignore
                    let auction = auctionNode.value.json;
                    delete auction["prev"];
                    delete auction["next"];
                    delete auction["value"]["domain"];
                    delete auction["value"]["nft"]["domain"];
                    // @ts-ignore
                    let auctionEndTime = Number(auction.value.end_timestamp_ms);
                    auction.endsIn = timeAgo(auctionEndTime);

                    if (auctionEndTime < now) {
                        res.unclaimedAuctions.push(auction);
                        res.unclaimedAuctionNames.push(
                            auction.value.nft.domain_name +
                                " " +
                                auction.value.winner,
                        );
                    } else {
                        res.auctions.push(auction);
                        res.auctionNames.push(
                            auction.value.nft.domain_name +
                                " " +
                                auction.endsIn,
                        );
                    }
                }

                // @ts-ignore
                if (object.data.owner.dynamicFields.pageInfo.hasNextPage) {
                    // @ts-ignore
                    cursorSection = `(after: "${object.data.owner.dynamicFields.pageInfo.endCursor}")`;
                } else {
                    break;
                }
            }

            value = res;
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    function timeAgo(timestamp: number): string {
        const now = new Date().getTime();
        const diff = timestamp - now;

        const seconds = Math.abs(diff) / 1000;
        const minutes = seconds / 60;
        const hours = minutes / 60;
        const days = hours / 24;
        const months = days / 30;

        if (diff > 0) {
            // Future times (e.g., "in 2 days")
            if (months >= 1)
                return `in ${Math.round(months)} month${months > 1 ? "s" : ""}`;
            if (days >= 1)
                return `in ${Math.round(days)} day${days > 1 ? "s" : ""}`;
            if (hours >= 1)
                return `in ${Math.round(hours)} hour${hours > 1 ? "s" : ""}`;
            if (minutes >= 1)
                return `in ${Math.round(minutes)} minute${minutes > 1 ? "s" : ""}`;
            return `in ${Math.round(seconds)} second${seconds > 1 ? "s" : ""}`;
        } else {
            // Past times (e.g., "1 day ago")
            if (months >= 1)
                return `${Math.round(months)} month${months > 1 ? "s" : ""} ago`;
            if (days >= 1)
                return `${Math.round(days)} day${days > 1 ? "s" : ""} ago`;
            if (hours >= 1)
                return `${Math.round(hours)} hour${hours > 1 ? "s" : ""} ago`;
            if (minutes >= 1)
                return `${Math.round(minutes)} minute${minutes > 1 ? "s" : ""} ago`;
            return `${Math.round(seconds)} second${seconds > 1 ? "s" : ""} ago`;
        }
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
                AUCTION_PACKAGE_ID = "";
                PAYMENTS_PACKAGE_ID = "";
                SUBDOMAIN_PACKAGE_ID = "";
                SUBDOMAIN_PROXY_PACKAGE_ID = "";
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
    <span>
        years:
        <input bind:value={years} type="number" placeholder="1" />
    </span>
    <span>
        bid price:
        <input bind:value={bidPrice} type="number" placeholder="0" />
    </span>
    <br />

    {#if IOTA_NAMES_OBJECT_ID.length != 0}
        IotaNames Object ID: {IOTA_NAMES_OBJECT_ID}
        <br />
    {/if}
    {#each [["Payments", PAYMENTS_PACKAGE_ID], ["Subdomain", SUBDOMAIN_PACKAGE_ID], ["Subdomain Proxy", SUBDOMAIN_PROXY_PACKAGE_ID], ["Auction", AUCTION_PACKAGE_ID]] as item}
        {#if item[1].length != 0}
            {item[0]} Package ID: {item[1]}
            <br />
        {/if}
    {/each}

    <button onclick={getPackageIds}> get package ids </button>
    <button onclick={resolveAddress}> resolve address </button>
    <button onclick={resolveName}> resolve name </button>
    <button onclick={getRegisteredNames}> get registered names </button>
    <button onclick={getReverseRegisteredAddresses}>
        get reverse registered addresses
    </button>
    <button onclick={getDynamicFields}> get dynamic fields </button>
    <button onclick={registerName}> register name </button>
    <button onclick={setTargetAddress}> set target address </button>
    <button onclick={setReverseLookup}> set reverse lookup </button>
    <button onclick={startAuctionAndPlaceBid}>
        start auction and place bid
    </button>
    <button onclick={placeBid}> place bid </button>
    <button onclick={claim}> claim </button>
    <button onclick={getAuctions}> get auctions </button>

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
