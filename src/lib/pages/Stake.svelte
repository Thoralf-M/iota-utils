<script lang="ts">
    import { Transaction } from "@iota/iota-sdk/transactions";
    import JSONTree from "svelte-json-tree-auto";
    import { getClient } from "../Client.svelte";
    import { iota_wallets } from "../WebWalletData.svelte";
    import {
        IOTA_SYSTEM_STATE_OBJECT_ID,
        isValidIotaAddress,
    } from "@iota/iota-sdk/utils";

    let validatorAddress =
        "0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215";
    const minStakeAmount = 1000000000;
    let amount = minStakeAmount;
    // Will be updated with the result
    let value = {};

    const stake = async () => {
        try {
            if (!isValidIotaAddress(validatorAddress)) {
                throw new Error("invalid address");
            }
            const tx = new Transaction();
            const stakeCoin = tx.splitCoins(tx.gas, [amount]);
            tx.moveCall({
                target: "0x3::iota_system::request_add_stake",
                arguments: [
                    tx.sharedObjectRef({
                        objectId: IOTA_SYSTEM_STATE_OBJECT_ID,
                        initialSharedVersion: 1,
                        mutable: true,
                    }),
                    stakeCoin,
                    tx.pure.address(validatorAddress),
                ],
            });

            let txResult = await $iota_wallets[0].signAndExecuteTransaction({
                transaction: tx,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
            });
            console.log(txResult);
            value = txResult;
            let client = await getClient();
            // result = JSON.stringify(txResult, null, 2);
            client.waitForTransaction({ digest: txResult.digest }).then(() => {
                console.log("tx block available via api");
            });
        } catch (err) {
            value = err.toString();
            console.error(err);
        }
    };
    let showJsonTree = true;
</script>

<main>
    <br />
    <span>
        validator address:
        <input
            bind:value={validatorAddress}
            placeholder="validator address 0x..."
            size="67"
        />
    </span>
    <br />
    <span>
        amount (min 1 IOTA):
        <input
            type="number"
            bind:value={amount}
            placeholder="amount"
            min="minStakeAmount"
        />
    </span>
    <br />

    <button on:click={() => stake()}> stake </button>

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
