<script lang="ts" module>
    import { IotaClient } from "@iota/iota-sdk/client";
    import { writable } from "svelte/store";
    
    let selectedUrlId: any = $state()
    let nodeUrls = $state({
        selectedUrlId: "2",
        list: [
    	{ id: "1", value: "http://127.0.0.1:9000" },
    	{ id: "2", value: "https://api.testnet.iota.cafe" },
    	{ id: "3", value: "https://api.devnet.iota.cafe" },
    	{ id: "4", value: "https://api.iota-rebased-alphanet.iota.cafe" },
    ]});
    let inputUrl = $state("")
    let nodeUrlsStore = localStorageStore(
        "nodeUrls",
        // svelte-ignore state_referenced_locally: this is fine as we update the store when a node is added
        $state.snapshot(nodeUrls),
    );

    nodeUrlsStore.subscribe((value) => {
        if (value) {
            console.log("nodeUrls: ", value);
            nodeUrls = value;
            selectedUrlId = nodeUrls.selectedUrlId
            console.log("selectedUrlId: ", selectedUrlId);
        }
    });

    // Used to determine if the client should be initialized with a new node
    let previousInitializedNodeUrl = "";
    let client: any = undefined;
    export const getClient = async (): Promise<IotaClient> => {
        let selectedUrl = nodeUrls.list.find((v) => v.id == selectedUrlId)!.value
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
        console.log("localStorage value: ", value);
        const store = writable(value == null ? initial : JSON.parse(value));
        store.subscribe((v) => {
           console.log("set item")
            localStorage.setItem(key, JSON.stringify(v))
        });
        return store;
    }
</script>

<main>
    <select bind:value={selectedUrlId} onchange={()=>{
        console.log("select changed")
        nodeUrls.selectedUrlId = selectedUrlId
        $nodeUrlsStore = $state.snapshot(nodeUrls);
    }}>
        {#each nodeUrls.list as nodeUrl}
            <option value={nodeUrl.id}>{nodeUrl.value}</option>
        {/each}
    </select>
    <input
    type="string"
    size="35"
    bind:value={inputUrl}
    placeholder="node URL like http://127.0.0.1:9000"
    />
    <button onclick={() => {
        nodeUrls.list.push({id: nodeUrls.list.length.toString(), value: inputUrl})
        $nodeUrlsStore = $state.snapshot(nodeUrls);
    }}> Add node URL</button>
</main>
