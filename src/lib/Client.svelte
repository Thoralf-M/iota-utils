<script lang="ts" module>
    import { IotaClient } from "@iota/iota-sdk/client";
    import { writable } from "svelte/store";

    let selectedUrl: any = $state();
    let nodeUrls = $state({
        selected: "https://api.testnet.iota.cafe",
        list: [
            { value: "http://127.0.0.1:9000" },
            { value: "https://api.testnet.iota.cafe" },
            { value: "https://api.devnet.iota.cafe" },
            { value: "https://api.iota-rebased-alphanet.iota.cafe" },
        ],
    });
    let inputUrl = $state("");
    let nodeUrlsStore = localStorageStore(
        "nodeUrls",
        // svelte-ignore state_referenced_locally: this is fine as we update the store when a node is added
        $state.snapshot(nodeUrls),
    );

    nodeUrlsStore.subscribe((value) => {
        if (value) {
            nodeUrls = value;
            selectedUrl = nodeUrls.selected;
        }
    });

    // Used to determine if the client should be initialized with a new node
    let previousInitializedNodeUrl = "";
    let client: any = undefined;
    export const getClient = async (): Promise<IotaClient> => {
        if (client == undefined || selectedUrl != previousInitializedNodeUrl) {
            client = new IotaClient({
                url: selectedUrl,
            });
            previousInitializedNodeUrl = selectedUrl;
        }
        return client;
    };

    function localStorageStore(key: string, initial: any) {
        const value = localStorage.getItem(key);
        const store = writable(value == null ? initial : JSON.parse(value));
        store.subscribe((v) => {
            localStorage.setItem(key, JSON.stringify(v));
        });
        return store;
    }
</script>

<main>
    <select
        bind:value={selectedUrl}
        onchange={() => {
            nodeUrls.selected = selectedUrl;
            $nodeUrlsStore = $state.snapshot(nodeUrls);
        }}
    >
        {#each nodeUrls.list as nodeUrl}
            <option value={nodeUrl.value}>{nodeUrl.value}</option>
        {/each}
    </select>
    <input
        type="string"
        size="35"
        bind:value={inputUrl}
        placeholder="node URL like http://127.0.0.1:9000"
    />
    <button
        onclick={() => {
            nodeUrls.list.push({
                value: inputUrl,
            });
            $nodeUrlsStore = $state.snapshot(nodeUrls);
        }}
    >
        Add node URL</button
    >
</main>
