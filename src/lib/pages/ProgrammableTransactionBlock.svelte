<script lang="ts">
    import { Transaction } from "@iota/iota-sdk/transactions";
    import JSONTree from "@sveltejs/svelte-json-tree";
    import { getClient } from "../Client.svelte";
    import {
        activeAddress,
        iota_accounts,
        iota_wallets,
    } from "../SignerData.svelte";
    import { basicSetup, EditorView } from "codemirror";
    import { javascript } from "@codemirror/lang-javascript";
    import { githubDark } from "@uiw/codemirror-theme-github";
    import { onMount } from "svelte";

    interface CodeSnippets {
        selected: string;
        snippets: CodeSnippet[];
    }
    interface CodeSnippet {
        name: string;
        code: string;
    }

    let codeSnippets: CodeSnippets = $state(
        JSON.parse(localStorage.getItem("codeSnippets")!) || {
            selected: "default",
            snippets: [
                {
                    name: "default",
                    code: `let tx = new Transaction();
// Build you tx here...

 const transfers = [
     { address: '0x9938c94f4118153bbed08f14ae74e2557172542f59bf0b7a306e99d5a0b0896e', amount: 1_000_000 },
     { address: '0x9938c94f4118153bbed08f14ae74e2557172542f59bf0b7a306e99d5a0b0896e', amount: 1_000_000 }];
 // first, split the gas coin into multiple coins
 const coins = tx.splitCoins(
     tx.gas,
     transfers.map((transfer) => transfer.amount),
 );
 // next, create a transfer transaction for each coin
 transfers.forEach((transfer, index) => {
     tx.transferObjects([coins[index]], transfer.address);
 })

// Client is also in scope
// const senderCoins = await client.getCoins({ owner: "0xee68634fb93502ec391e78ccc94568e9e179ef8ec37fe12daaac4d2c2af32d5c", limit: 10 });
// console.log(senderCoins) // visible in the browser console
`,
                },
            ],
        },
    );

    function saveCodeSnippetsToLocalstorage() {
        localStorage.setItem("codeSnippets", JSON.stringify(codeSnippets));
    }

    let codeEditor: HTMLDivElement;
    let codeEditorPreview: HTMLDivElement;
    let codeEditorView: EditorView;
    let codeEditorPreviewView: EditorView;
    function createEditor(parent: HTMLDivElement) {
        return new EditorView({
            doc: activeCode,
            extensions: [
                basicSetup,
                javascript(),
                githubDark,
                EditorView.updateListener.of((v: any) => {
                    if (v.docChanged) {
                        // TODO: store index extra so this find isn't needed?
                        let index = codeSnippets.snippets.findIndex(
                            (e) => e.name == codeSnippets.selected,
                        );
                        codeSnippets.snippets[index].code =
                            codeEditorView.state.doc.toString();
                        saveCodeSnippetsToLocalstorage();
                    }
                }),
            ],
            parent: parent,
        });
    }
    onMount(() => {
        codeEditorView = createEditor(codeEditor);
        codeEditorPreviewView = createEditor(codeEditorPreview);
    });

    // Will be updated with the result
    let value = $state({});

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

    let showJsonTree = $state(true);

    let activeCode = $state(
        codeSnippets.snippets.find((e) => e.name == codeSnippets.selected)!
            .code,
    );

    async function buildTransaction(): Promise<Transaction | undefined> {
        try {
            activeCode = codeEditorView.state.doc.toString();
            // Scope is required to make the Transaction class available
            const client = await getClient();
            const scope = { Transaction, client };
            return new Function(
                "scope",
                `with(scope) {
                return (async function() {
                    try {
                        ${activeCode}
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

    let inputCodeSnippetName = $state("");
    let showPreview = $state(false);
    function replaceCode(codeSnippetName: string) {
        activeCode = codeSnippets.snippets.find(
            (e) => e.name == codeSnippetName,
        )!.code;
        codeSnippets.selected = codeSnippetName;
        saveCodeSnippetsToLocalstorage();
        codeEditorView.dispatch({
            changes: {
                from: 0,
                to: codeEditorView.state.doc.length,
                insert: activeCode,
            },
        });
    }
    function addCodeSnippet() {
        // TODO: check for existing name and then error/add number?
        let newName = inputCodeSnippetName || codeSnippets.snippets.length;
        deleteCodeSnippet();
        codeSnippets.snippets.push({
            name: newName,
            code: codeEditorView.state.doc.toString(),
        });
        codeSnippets.selected = newName;
        inputCodeSnippetName = "";
        saveCodeSnippetsToLocalstorage();
    }
    function renameCodeSnippet() {
        if (inputCodeSnippetName.length == 0) {
            alert!("insert a new name first");
        }
        let index = codeSnippets.snippets.findIndex(
            (e) => e.name == codeSnippets.selected,
        );
        codeSnippets.snippets[index].name = inputCodeSnippetName;
        codeSnippets.selected = inputCodeSnippetName;
        inputCodeSnippetName = "";
        saveCodeSnippetsToLocalstorage();
    }
    function deleteCodeSnippet() {
        if (inputCodeSnippetName.length == 0) {
            alert!("insert a name to delete first");
        }
        let index = codeSnippets.snippets.findIndex(
            (e) => e.name == inputCodeSnippetName,
        );
        if (index > -1) {
            codeSnippets.snippets.splice(index, 1);
            saveCodeSnippetsToLocalstorage();
        }
    }
</script>

<main>
    <div>
        <div
            class="codeSnippet-selection"
            style="float: left; padding-right: 1em;"
        >
            <div style="float: left; display:flexbox">
                <button onclick={addCodeSnippet}> new </button>
                <button onclick={renameCodeSnippet}> rename </button>
                <button onclick={deleteCodeSnippet}> delete </button>
            </div>
            <br />
            Name:
            <input
                bind:value={inputCodeSnippetName}
                placeholder="string"
                size="15"
            />
            <div style="border: 1px solid #dee2e6; ">
                {#each codeSnippets.snippets as codeSnippet}
                    <div
                        class={codeSnippets.selected == codeSnippet.name
                            ? "active"
                            : ""}
                    >
                        <button
                            onclick={() => replaceCode(codeSnippet.name)}
                            onmouseover={() => {
                                showPreview = true;
                                codeEditorPreviewView.dispatch({
                                    changes: {
                                        from: 0,
                                        to: codeEditorPreviewView.state.doc
                                            .length,
                                        insert: codeSnippet.code,
                                    },
                                });
                            }}
                            onmouseout={() => {
                                showPreview = false;
                            }}
                            onfocus={() => {}}
                            onblur={() => {}}
                        >
                            {codeSnippet.name}
                        </button>
                    </div>
                {/each}
            </div>
        </div>
        <div hidden={showPreview}>
            <div class="codemirror-wrapper" bind:this={codeEditor}></div>
        </div>
        <div hidden={!showPreview}>
            <div class="codemirror-wrapper" bind:this={codeEditorPreview}></div>
        </div>
    </div>

    <button onclick={devInspect}> dev inspect </button>
    <button onclick={dryRun}> dry run </button>
    <button onclick={execute}> execute </button>

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
        margin: 0.2rem;
    }
    .codemirror-wrapper {
        text-align: left;
    }
    div.active > button {
        color: #495057;
        background-color: #fff;
        border-color: #dee2e6 #dee2e6 #fff;
    }
</style>
