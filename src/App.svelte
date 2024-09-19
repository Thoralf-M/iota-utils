<script>
    import Ed25519AddressGeneration from "./lib/pages/Ed25519AddressGeneration.svelte";
    import Converter from "./lib/pages/Converter.svelte";
    import PTB from "./lib/pages/ProgrammableTransactionBlock.svelte";
    import Client from "./lib/Client.svelte";
    import Tabs from "./lib/Tabs.svelte";

    // List of tab items with labels, values and assigned components
    let items = [
        {
            label: "Ed25519 address generation",
            component: Ed25519AddressGeneration,
        },
        { label: "converter", component: Converter },
        { label: "PTB", component: PTB },
    ].map((e, index) => {
        // @ts-ignore
        e.value = index;
        return e;
    });
</script>

<Client />
<Tabs {items} />
<a
    href="https://github.com/Thoralf-M/iota-utils"
    target="_blank"
    rel="noopener noreferrer">https://github.com/Thoralf-M/iota-utils</a
>
