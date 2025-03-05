<script lang="ts" module>
    import { IotaClient } from "@iota/iota-sdk/client";
    import { writable } from "svelte/store";

    export let showSettings = writable(false);

    let selectedNetwork: any = $state();

    interface Network {
        name: string;
        url: string;
        graphql: string;
    }
    interface ClientConfig {
        selected: string;
        networks: Network[];
    }

    const defaultConfig = {
        selected: "testnet",
        networks: [
            {
                name: "localnet",
                url: "http://127.0.0.1:9000",
                graphql: "http://127.0.0.1:9125",
            },
            {
                name: "testnet",
                url: "https://api.testnet.iota.cafe",
                graphql: "https://graphql.testnet.iota.cafe",
            },
            {
                name: "devnet",
                url: "https://api.devnet.iota.cafe",
                graphql: "https://graphql.devnet.iota.cafe",
            },
            {
                name: "alphanet",
                url: "https://api.iota-rebased-alphanet.iota.cafe",
                graphql: "https://graphql.iota-rebased-alphanet.iota.cafe",
            },
        ],
    };

    let clientConfig: ClientConfig = $state(
        JSON.parse(localStorage.getItem("clientConfig")!) || defaultConfig,
    );
    // svelte-ignore state_referenced_locally
    selectedNetwork = clientConfig.selected;

    // svelte-ignore state_referenced_locally
    let jsonClientConfigString = $state(JSON.stringify(clientConfig, null, 2));

    let clientConfigStore = localStorageStore(
        "clientConfig",
        // svelte-ignore state_referenced_locally: this is fine as we update the store when a node is added
        $state.snapshot(clientConfig),
    );

    function handleInput() {
        try {
            clientConfig = JSON.parse(jsonClientConfigString);
            if (
                !clientConfig.hasOwnProperty("selected") ||
                !clientConfig.hasOwnProperty("networks")
            ) {
                alert(`Missing "selected" or "networks" keys`);
            } else {
                // Update selected network if the selected one was removed
                let exists = clientConfig.networks.find(
                    (a) => a.name == clientConfig.selected,
                );
                if (typeof exists == "undefined") {
                    clientConfig.selected = clientConfig.networks[0].name;
                    selectedNetwork = clientConfig.selected;
                    jsonClientConfigString = JSON.stringify(
                        clientConfig,
                        null,
                        2,
                    );
                }

                localStorage.setItem(
                    "clientConfig",
                    JSON.stringify(clientConfig),
                );
            }
        } catch (e) {
            console.error("Invalid JSON", e);
        }
    }

    // Used to determine if the client should be initialized with a new node
    let previousInitializedNodeUrl = "";
    let client: any = undefined;
    export const getClient = async (): Promise<IotaClient> => {
        let selectedNetworkUrl = clientConfig.networks.find(
            (network) => network.name == selectedNetwork,
        )?.url!;
        if (
            client == undefined ||
            selectedNetworkUrl != previousInitializedNodeUrl
        ) {
            client = new IotaClient({
                url: selectedNetworkUrl,
            });
            previousInitializedNodeUrl = selectedNetworkUrl;
        }
        return client;
    };

    export function getSelectedNetwork(): Network {
        return clientConfig.networks.find(
            (network) => network.name == selectedNetwork,
        )!;
    }

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
    Network: <select
        bind:value={selectedNetwork}
        onchange={() => {
            clientConfig.selected = selectedNetwork;
            $clientConfigStore = clientConfig;
            localStorage.setItem("clientConfig", JSON.stringify(clientConfig));
            jsonClientConfigString = JSON.stringify(clientConfig, null, 2);
        }}
    >
        {#each clientConfig.networks as network}
            <option value={network.name}>{network.name}</option>
        {/each}
    </select>

    <button
        onclick={() => {
            $showSettings = !$showSettings;
        }}>Show settings</button
    >
    {#if $showSettings}
        <div>
            <textarea
                bind:value={jsonClientConfigString}
                oninput={handleInput}
                rows="12"
                cols="100"
            ></textarea>
        </div>
        <button
            onclick={() => {
                localStorage.removeItem("clientConfig");
                clientConfig = defaultConfig;
                selectedNetwork = clientConfig.selected;
                $clientConfigStore = clientConfig;
                jsonClientConfigString = JSON.stringify(clientConfig, null, 2);
            }}>Reset networks</button
        >
    {/if}
</main>
