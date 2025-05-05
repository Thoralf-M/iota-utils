<script>
    import Ed25519AddressGeneration from "./lib/pages/Ed25519AddressGeneration.svelte";
    import Converter from "./lib/pages/Converter.svelte";
    import Faucet from "./lib/pages/Faucet.svelte";
    import Client from "./lib/Client.svelte";
    import Tabs from "./lib/Tabs.svelte";
    import IotaSystemState from "./lib/pages/IotaSystemState.svelte";
    import PublishData from "./lib/pages/PublishData.svelte";
    import SplitMergeCoins from "./lib/pages/SplitMergeCoins.svelte";
    import Signer from "./lib/Signer.svelte";
    import Stake from "./lib/pages/Stake.svelte";
    import IotaNames from "./lib/pages/IotaNames.svelte";
    import WebWallet from "./lib/WebWallet.svelte";
    import ProgrammableTransactionBlock from "./lib/pages/ProgrammableTransactionBlock.svelte";

    // List of tab items with labels, values and assigned components
    let items = [
        {
            label: "Ed25519 address generation",
            component: Ed25519AddressGeneration,
        },
        { label: "Converter", component: Converter },
        { label: "Faucet", component: Faucet },
        { label: "IOTA System State", component: IotaSystemState },
        { label: "Publish Data", component: PublishData },
        { label: "PTB Code", component: ProgrammableTransactionBlock },
        { label: "Split Merge Coins", component: SplitMergeCoins },
        { label: "Stake", component: Stake },
        { label: "IOTA-Names", component: IotaNames },
    ].map((e, index) => {
        // @ts-ignore
        e.value = index;
        return e;
    });
</script>

<Client />
<Signer />
<WebWallet />
<Tabs {items} />
<a
    href="https://github.com/Thoralf-M/iota-utils"
    target="_blank"
    rel="noopener noreferrer">https://github.com/Thoralf-M/iota-utils</a
>
