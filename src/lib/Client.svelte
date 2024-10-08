<script lang="ts" context="module">
    import { IotaClient } from "@iota/iota-sdk/client";
    import { writable } from "svelte/store";

    let nodeUrlStorage = localStorageStore("nodeUrl", "http://127.0.0.1:9000");
    export let nodeUrl = "http://127.0.0.1:9000";
    nodeUrlStorage.subscribe((value) => {
        nodeUrl = value;
    });

    // Used to determine if the client should be initialized with a new node
    let previousInitializedNodeUrl = "";
    let client: any = undefined;
    export const getClient = async () => {
        if (client == undefined || nodeUrl != previousInitializedNodeUrl) {
            client = new IotaClient({
                url: nodeUrl,
            });
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
        list="urls"
    />
    <datalist id="urls">
        <option value={"http://127.0.0.1:9000"}>Localnet </option>
        <option value={"https://api.hackanet.iota.cafe"}>Hackanet </option>
        <option value={"https://api.iota-rebased-alphanet.iota.cafe"}
            >Alphanet
        </option>
    </datalist>
</main>
