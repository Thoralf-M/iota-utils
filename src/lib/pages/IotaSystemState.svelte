<script lang="ts">
    import JSONTree from "@sveltejs/svelte-json-tree";
    import { getClient } from "../Client.svelte";

    let value = {};
    let apiVersion = "";
    const getLatestSystemState = async () => {
        try {
            let client = await getClient();
            apiVersion = (await client.getRpcApiVersion()) || "";
            const systemState = await client.getLatestIotaSystemState();
            console.log(systemState);
            value = systemState;
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    };
    let showJsonTree = true;
</script>

<main>
    <button on:click={() => getLatestSystemState()}>
        get latest iota system state
    </button>

    <div class="value" hidden={Object.keys(value).length == 0}>
        <div>
            API Version: {apiVersion}
        </div>
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
