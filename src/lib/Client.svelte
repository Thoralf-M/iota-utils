<script lang="ts" context="module">
    // import { Client, initLogger } from "@iota/sdk-wasm/web";
    import { writable } from "svelte/store";

    let nodeUrlStorage = localStorageStore("nodeUrl", "http://localhost:8050");
    export let nodeUrl = "";
    nodeUrlStorage.subscribe((value) => {
        nodeUrl = value;
    });

    let loggerInitialized = false;
    // Used to determine if the client should be initialized with a new node
    let previousInitializedNodeUrl = "";
    let client: any = undefined;
    export const getClient = async () => {
        if (!loggerInitialized) {
            // await initLogger();
            loggerInitialized = true;
        }
        if (client == undefined || nodeUrl != previousInitializedNodeUrl) {
            // client = await Client.create({
            //     nodes: [nodeUrl],
            // });
            previousInitializedNodeUrl = nodeUrl;
        }
        return client;
    };

    function localStorageStore(key: string, initial: string) {
        const value = localStorage.getItem(key);
        const store = writable(value == null ? initial : JSON.parse(value));
        store.subscribe((v) => localStorage.setItem(key, JSON.stringify(v)));
        return store;
    }
</script>

<main>
    <input
        size="50"
        bind:value={nodeUrl}
        placeholder="node url"
        on:input={() => nodeUrlStorage.update((v) => (v = nodeUrl))}
    />
</main>
