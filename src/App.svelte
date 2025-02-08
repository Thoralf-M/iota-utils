<script>
    import Ed25519AddressGeneration from "./lib/pages/Ed25519AddressGeneration.svelte";
    import Converter from "./lib/pages/Converter.svelte";
    import Faucet from "./lib/pages/Faucet.svelte";
    import Client from "./lib/Client.svelte";
    import Tabs from "./lib/Tabs.svelte";
    import IotaSystemState from "./lib/pages/IotaSystemState.svelte";
    import PublishData from "./lib/pages/PublishData.svelte";
    import SplitMergeCoins from "./lib/pages/SplitMergeCoins.svelte";
    import Stake from "./lib/pages/Stake.svelte";
    import Iotans from "./lib/pages/Iotans.svelte";
    import WebWallet from "./lib/WebWallet.svelte";

    // List of tab items with labels, values and assigned components
    let items = [
        {
            label: "Ed25519 address generation",
            component: Ed25519AddressGeneration,
        },
        { label: "Converter", component: Converter },
        { label: "Faucet", component: Faucet },
        { label: "Iota System State", component: IotaSystemState },
        { label: "Publish Data", component: PublishData },
        { label: "Split Merge Coins", component: SplitMergeCoins },
        { label: "Stake", component: Stake },
        { label: "Iotans", component: Iotans },
    ].map((e, index) => {
        // @ts-ignore
        e.value = index;
        return e;
    });
</script>

<Client />
<WebWallet />
<Tabs {items} />
<a
    href="https://github.com/Thoralf-M/iota-utils"
    target="_blank"
    rel="noopener noreferrer">https://github.com/Thoralf-M/iota-utils</a
>
