<script lang="ts">
    import { requestIotaFromFaucetV0 } from "@iota/iota-sdk/faucet";
    import JSONTree from "svelte-json-tree-auto";

    let address =
        "0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215";
    let faucetUrl = "https://faucet.hackanet.iota.cafe/gas";
    let value = {};

    const requestFunds = async () => {
        try {
            if (address.length != 64 && address.length != 66) {
                throw new Error("address has an invalid length");
            }
            const faucetResponse = await requestIotaFromFaucetV0({
                host: faucetUrl,
                recipient: address,
            });
            console.log(faucetResponse);
            value = faucetResponse;
        } catch (err) {
            value = err.toString();
            console.error(err);
        }
    };
    let showJsonTree = true;

    let localFaucetUrl = "http://127.0.0.1:9123/gas";
</script>

<main>
    <span>
        faucet URL:
        <input
            type="string"
            list="faucetUrls"
            size="60"
            bind:value={faucetUrl}
            placeholder="faucet URL, like http://127.0.0.1:9123/gas"
        />
        <datalist id="faucetUrls">
            <option value={localFaucetUrl}>Localnet </option>
            <option value={"https://faucet.hackanet.iota.cafe/gas"}
                >Hackanet
            </option>
            <option value={"https://faucet.iota-rebased-alphanet.iota.cafe/gas"}
                >Alphanet
            </option>
        </datalist>
    </span>
    <br />
    <span>
        address:
        <input bind:value={address} placeholder="address" size="67" />
    </span>
    <br />

    <button on:click={() => requestFunds()}> Request funds </button>

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
</style>
