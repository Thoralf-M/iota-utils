<script lang="ts">
    import JSONTree from "@sveltejs/svelte-json-tree";
    import { getClient } from "../Client.svelte";
    import TransportWebHID from "@ledgerhq/hw-transport-webhid";
    import IotaLedgerClient from "@iota/ledgerjs-hw-app-iota";
    import { toHEX } from "@iota/bcs";

    const IOTA_BIP44_COIN_TYPE = 4218;
    const TESTNET_BIP44_COIN_TYPE = 1;
    let coinType = $state(IOTA_BIP44_COIN_TYPE);
    let accountIndex = $state(0);
    let change = $state(0);
    let addressIndex = $state(0);

    let numberToIncrease = $state(5);
    let accountOrAddress = $state("account");

    // Will be updated with the result
    let value = $state({});
    type AccountEntry = {
        address: string;
        publicKey: string;
        bip44Path: string;
        totalBalance?: string;
    };
    let accountEntries: AccountEntry[] = $state([]);

    let ledgerTransport: any;

    async function connect() {
        try {
            ledgerTransport = await TransportWebHID.create();
            console.log(ledgerTransport);
            value = "connected!";
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    async function generateAddress() {
        try {
            // @ts-ignore
            const ledgerClient = new IotaLedgerClient(ledgerTransport);
            let bip44Path = `m/44'/${coinType}'/${accountIndex}'/${change}'/${addressIndex}'`;
            console.log(bip44Path);

            const exists = accountEntries.some(
                (entry) => entry.bip44Path === bip44Path,
            );
            if (exists) {
                return;
            }

            let result = await ledgerClient.getPublicKey(bip44Path);
            console.log(result);
            let publicKey = "0x" + toHEX(result.publicKey);
            let address = "0x" + toHEX(result.address);
            accountEntries.push({
                address: address,
                publicKey: publicKey,
                bip44Path,
            });
            value = accountEntries;
            formatAsTable();
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    async function generateMultipleAddresses() {
        try {
            if (accountOrAddress == "account") {
                let finalIndex = accountIndex + numberToIncrease;
                for (accountIndex; accountIndex < finalIndex; accountIndex++) {
                    await generateAddress();
                }
            } else {
                let finalIndex = addressIndex + numberToIncrease;
                for (addressIndex; addressIndex < finalIndex; addressIndex++) {
                    await generateAddress();
                }
            }
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }

    type AddressWithIndex = {
        address: string;
        internal: boolean;
        index: number;
        totalBalance?: string;
    };
    type GroupedAccountEntry = [number, AddressWithIndex[]];
    let tableAccounts: GroupedAccountEntry[] = $state([]);
    let expanded: number[] = $state([]);

    function formatAsTable() {
        type GroupedAccounts = {
            [accountIndex: number]: AddressWithIndex[];
        };
        // Group by account index
        let grouped: GroupedAccounts = [];

        for (const address of accountEntries) {
            const match = address.bip44Path.match(
                /m\/44'\/\d+'\/(\d+)'\/(\d+)'\/(\d+)'?/,
            );
            if (!match) {
                throw new Error("Invalid BIP44 path:" + address.bip44Path);
            }
            const accountIndex = parseInt(match[1]);
            const change = parseInt(match[2]);
            const addressIndex = parseInt(match[3]);

            if (!grouped[accountIndex]) {
                grouped[accountIndex] = [];
            }

            grouped[accountIndex].push({
                address: address.address,
                internal: change == 1,
                index: addressIndex,
                totalBalance: address.totalBalance,
            });
            grouped[accountIndex].sort((a, b) => a.index - b.index);
        }

        tableAccounts = Object.entries(grouped).map(([key, value]) => [
            parseInt(key),
            value,
        ]);
    }
    function toggle(index: number) {
        if (expanded.includes(index)) {
            expanded = expanded.filter((i) => i !== index);
        } else {
            expanded = [...expanded, index];
        }
    }

    function isExpanded(index: number): boolean {
        return expanded.includes(index);
    }
    async function getUnknownBalances() {
        try {
            const client = await getClient();
            for (const entry of accountEntries) {
                // skip if the balance is already known
                if (entry.totalBalance) {
                    continue;
                }
                let balance = await client.getBalance({
                    owner: entry.address,
                });
                entry.totalBalance = balance.totalBalance;
            }
            formatAsTable();
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }
    let showJsonTree = $state(true);
</script>

<main>
    <button onclick={() => connect()}> connect </button>
    <br />
    BIP 44 path: (m/44'/coinType'/accountIndex'/change'/addressIndex')
    <br />
    <input
        type="number"
        list="coinTypes"
        bind:value={coinType}
        placeholder="BIP-44 coin type"
    />
    <datalist id="coinTypes">
        <option value={IOTA_BIP44_COIN_TYPE}>IOTA </option>
        <option value={TESTNET_BIP44_COIN_TYPE}>Testnet </option>
    </datalist>

    <input
        type="number"
        min="0"
        bind:value={accountIndex}
        placeholder="account index"
    />
    <select bind:value={change}>
        <option value={0}>0</option>
        <option value={1}>1</option>
    </select>
    <input
        type="number"
        width="1"
        min="0"
        bind:value={addressIndex}
        placeholder="address index"
    />

    <button onclick={() => generateAddress()}> generate address </button>
    <br />

    increase
    <select bind:value={accountOrAddress}>
        <option value={"account"}>account</option>
        <option value={"address"}>address</option>
    </select>
    index by:
    <input
        type="number"
        min="1"
        bind:value={numberToIncrease}
        placeholder="number to generate"
    />

    <button onclick={() => generateMultipleAddresses()}>
        generate multiple addresses
    </button>
    <button
        onclick={() => {
            accountEntries = [];
            tableAccounts = [];
            value = "";
        }}
    >
        clear address list
    </button>
    <button
        onclick={() => {
            // expand all sections of the table
            expanded = tableAccounts.map((e) => e[0]);
        }}
    >
        expand all
    </button>
    <button
        onclick={() => {
            // collapse all sections of the table
            expanded = [];
        }}
    >
        collapse all
    </button>
    <button onclick={() => getUnknownBalances()}> get unknown balances </button>

    <div
        class="value"
        hidden={Object.keys(value).length == 0 ||
            // @ts-ignore
            value.length == 0}
    >
        <button onclick={() => (showJsonTree = !showJsonTree)}>
            toggle JSON tree
        </button>
        <div hidden={!showJsonTree}>
            <JSONTree {value} />
        </div>
        <pre hidden={showJsonTree}>{JSON.stringify(value, null, 2)}</pre>
    </div>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        th,
        td {
            padding: 0.75rem;
            border: 1px solid #ccc;
            text-align: left;
        }
        td.accountEntries {
            font-family: monospace;
        }
        tr.clickable {
            cursor: pointer;
            background-color: #f9f9f9;
        }
        tr.clickable:hover {
            background-color: #eee;
        }
    </style>

    <table>
        <thead>
            <tr>
                <th>Account</th>
                <th>Addresses</th>
            </tr>
        </thead>
        <tbody>
            {#each tableAccounts as [index, addresses]}
                <tr class="clickable" onclick={() => toggle(index)}>
                    <td>Account {index} (addresses: {addresses.length})</td>
                    <td
                        >{isExpanded(index)
                            ? "▼ Click to collapse"
                            : "▶ Click to expand"}</td
                    >
                </tr>
                {#if isExpanded(index)}
                    <tr>
                        <td colspan="2">
                            <table class="inner-table">
                                <thead>
                                    <tr>
                                        <th>Index</th>
                                        <th>Internal</th>
                                        <th>Address</th>
                                        <th>Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each addresses as addr}
                                        <tr>
                                            <td>{addr.index}</td>
                                            <td>{addr.internal}</td>
                                            <td class="mono">{addr.address}</td>
                                            <td>{addr.totalBalance}</td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                {/if}
            {/each}
        </tbody>
    </table>
</main>

<style>
    .value,
    pre {
        text-align: left;
    }
    button {
        margin: 0.5rem;
    }
    .inner-table {
        width: 100%;
        margin-top: 0.5rem;
        border-collapse: collapse;
        font-size: 0.9rem;
    }

    .inner-table th,
    .inner-table td {
        border: 1px solid #4f4f4f;
        padding: 0.4rem 0.6rem;
        text-align: left;
    }
    .inner-table th,
    td {
        background-color: #262626;
    }

    .mono {
        font-family: monospace;
    }
</style>
