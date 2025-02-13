<script lang="ts">
    import { Transaction } from "@iota/iota-sdk/transactions";
    import JSONTree from "svelte-json-tree";
    import { getClient } from "../Client.svelte";
    import {
        activeAddress,
        iota_accounts,
        iota_wallets,
    } from "../SignerData.svelte";
    import { basicSetup, EditorView } from "codemirror";
    import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
    import { javascript } from "@codemirror/lang-javascript";
    import { onMount } from "svelte";

    let element: HTMLDivElement;
    let view: EditorView;
    // Overwrite JS style with white
    const myHighlightStyle = HighlightStyle.define([]);
    let myTheme = EditorView.theme({}, { dark: true });
    function createEditor() {
        return new EditorView({
            doc: jsCode,
            extensions: [
                basicSetup,
                javascript(),
                myTheme,
                syntaxHighlighting(myHighlightStyle),
            ],
            parent: element,
        });
    }
    onMount(() => {
        view = createEditor();
    });

    // Will be updated with the result
    let value = {};

    async function devInspect() {
        let tx = (await buildTransaction())!;
        console.log("devInspect", tx);
        let client = await getClient();
        const devInspectResult = await client.devInspectTransactionBlock({
            sender:
                $activeAddress ||
                "0x0000000000000000000000000000000000000000000000000000000000000000",
            transactionBlock: tx,
        });
        console.log(devInspectResult);
        value = devInspectResult;
    }

    async function dryRun() {
        let tx = (await buildTransaction())!;
        console.log("dryRun", tx);
        let client = await getClient();
        tx.setSender(
            $activeAddress ||
                "0x0000000000000000000000000000000000000000000000000000000000000000",
        );
        const bytes = await tx.build({ client });
        const dryRunResult = await client.dryRunTransactionBlock({
            transactionBlock: bytes,
        });
        console.log(dryRunResult);
        value = dryRunResult;
    }

    async function execute() {
        try {
            let tx = (await buildTransaction())!;
            console.log("execute", tx);
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
            console.log(txResult);
            value = txResult;
            let client = await getClient();
            // result = JSON.stringify(txResult, null, 2);
            client.waitForTransaction({ digest: txResult.digest }).then(() => {
                console.log("tx block available via api");
            });
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }

    let showJsonTree = true;

    let jsCode = `let tx = new Transaction();
// Build you tx here...

// const transfers = [
//     { address: '0x9938c94f4118153bbed08f14ae74e2557172542f59bf0b7a306e99d5a0b0896e', amount: 1_000_000 },
//     { address: '0x9938c94f4118153bbed08f14ae74e2557172542f59bf0b7a306e99d5a0b0896e', amount: 1_000_000 }];
// // first, split the gas coin into multiple coins
// const coins = tx.splitCoins(
//     tx.gas,
//     transfers.map((transfer) => transfer.amount),
// );
// // next, create a transfer transaction for each coin
// transfers.forEach((transfer, index) => {
//     tx.transferObjects([coins[index]], transfer.address);
// })

// Client is also in scope
// const senderCoins = await client.getCoins({ owner: "0xee68634fb93502ec391e78ccc94568e9e179ef8ec37fe12daaac4d2c2af32d5c", limit: 10 });
// console.log(senderCoins) // visible in the browser console
`;

    async function buildTransaction(): Promise<Transaction | undefined> {
        try {
            jsCode = view.state.doc.toString();
            // Scope is required to make the Transaction class available
            const client = await getClient();
            const scope = { Transaction, client };
            return new Function(
                "scope",
                `with(scope) {
                return (async function() {
                    try {
                        ${jsCode}
                        return tx
                    } catch (error) {
                        alert('Error in code: ' + error.message);
                    }
                })()
                }`,
            )(scope);
        } catch (error: any) {
            alert("Error in code: " + error.message);
        }
    }
</script>

<main>
    <h3>Programmable Transaction Block</h3>
    <div>
        <div class="codemirror-wrapper" bind:this={element}></div>
    </div>

    <button on:click={devInspect}> dev inspect </button>
    <button on:click={dryRun}> dry run </button>
    <button on:click={execute}> execute </button>

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
    .codemirror-wrapper {
        text-align: left;
    }
</style>
