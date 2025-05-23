<script lang="ts">
    import { Transaction } from "@iota/iota-sdk/transactions";
    import JSONTree from "@sveltejs/svelte-json-tree";
    import { getClient } from "../Client.svelte";
    import {
        activeAddress,
        iota_accounts,
        iota_wallets,
    } from "../SignerData.svelte";
    import {
        IOTA_SYSTEM_STATE_OBJECT_ID,
        isValidIotaAddress,
    } from "@iota/iota-sdk/utils";
    import type { IotaObjectData } from "@iota/iota-sdk/client";
    import {
        dragHandle,
        dragHandleZone,
        type DndEvent,
    } from "svelte-dnd-action";
    import WebWallet from "../WebWallet.svelte";
    import { onMount } from "svelte";

    // Will be updated with the result
    let value = $state({});

    interface ExtendedAccount {
        id: string;
        address: string;
        label: string | undefined;
        objects: {
            id: string;
            label: string;
            data: any;
            currentOwner: string;
        }[];
    }

    let extendedAccounts: ExtendedAccount[] = $state([]);

    let webWalletComponent: WebWallet;
    let connectWallet: any;
    onMount(function () {
        connectWallet = async function () {
            await webWalletComponent.connectWallet();
        };
    });
    const syncReset = async () => {
        try {
            await connectWallet();
            extendedAccounts = $iota_accounts.map((account, i) => {
                return {
                    id: account.address,
                    address: account.address,
                    label: account.label,
                    objects: [],
                };
            });
            await getObjects();
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    };

    let showJsonTree = $state(true);

    function handleDnd(event: CustomEvent<DndEvent<any>>) {
        // Find the account being updated and set its new items
        const idx = extendedAccounts.findIndex(
            // @ts-ignore
            (acc) => acc.address === event.srcElement.classList[0],
        );
        if (idx !== -1) {
            // Make items unique by id
            const seen = new Set();
            const uniqueItems = event.detail.items.filter((item) => {
                if (seen.has(item.id)) {
                    return false;
                }
                seen.add(item.id);
                return true;
            });
            // Create a new array/object to trigger reactivity
            extendedAccounts = [
                ...extendedAccounts.slice(0, idx),
                { ...extendedAccounts[idx], objects: uniqueItems },
                ...extendedAccounts.slice(idx + 1),
            ];
        }
    }

    async function getObjects() {
        try {
            const client = await getClient();
            // Iterate over extendedAccounts, get the owned objects for each account and set them in the objects field
            const updatedAccounts = await Promise.all(
                extendedAccounts.map(async (account) => {
                    const result = await client.getOwnedObjects({
                        owner: account.address,
                        options: { showContent: true, showType: true },
                    });

                    // Map the returned objects to the expected format
                    const objects = result.data.map((obj, idx) => {
                        // @ts-ignore
                        let label = obj.data.content?.type;
                        if (typeof label === "string") {
                            // Only show the actual type name
                            label = label.split("::").slice(2).join("::");
                        }
                        return {
                            // @ts-ignore
                            id: obj.data.objectId,
                            label,
                            // @ts-ignore
                            data: obj.data.content!,
                            currentOwner: account.address,
                        };
                    });
                    return { ...account, objects };
                }),
            );
            extendedAccounts = updatedAccounts;
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    }

    function formatBigIntWithDecimal(
        bigint: BigInt,
        decimalPlaces: number,
    ): string {
        const str = bigint.toString();
        const len = str.length;

        if (len <= decimalPlaces) {
            // Pad with zeros on the left if necessary
            const padded = str.padStart(decimalPlaces, "0");
            return `0.${padded}`;
        }

        const intPart = str.slice(0, len - decimalPlaces);
        const decimalPart = str.slice(len - decimalPlaces);
        return `${intPart}.${decimalPart}`;
    }

    const nanoToIota = (nano: string) => {
        return formatBigIntWithDecimal(BigInt(nano.replace(/_/g, "")), 9);
    };
</script>

<WebWallet bind:this={webWalletComponent} />
<main>
    <button onclick={syncReset}> sync/reset </button>

    <div class="value" hidden={Object.keys(value).length == 0}>
        <button onclick={() => (showJsonTree = !showJsonTree)}>
            toggle JSON tree
        </button>
        <div hidden={!showJsonTree}>
            <JSONTree {value} />
        </div>
        <pre hidden={showJsonTree}>{JSON.stringify(value, null, 2)}</pre>
    </div>

    <div class="grid">
        {#each extendedAccounts as account (account.id)}
            <div class="account">
                <div>
                    {account.label ||
                        account.address.slice(0, 6) +
                            "..." +
                            account.address.slice(-4)}
                </div>
                <div
                    use:dragHandleZone={{
                        items: account.objects,
                        flipDurationMs: 200,
                    }}
                    onconsider={handleDnd}
                    onfinalize={handleDnd}
                    class={account.id}
                >
                    {#each account.objects as item (item.id)}
                        <div style="border: 1px solid #525252;">
                            <div
                                use:dragHandle
                                aria-label="drag-handle"
                                class="handle"
                                style=" {account.address !== item.currentOwner
                                    ? 'background-color: #19400e;'
                                    : ''}"
                            >
                                <span>
                                    {#if item.label.startsWith("Coin<0x2::iota::IOTA>")}
                                        {item.label}: {nanoToIota(
                                            item.data?.fields?.balance,
                                        )} IOTA
                                    {:else if item.label == "StakedIota"}
                                        {item.label}: {nanoToIota(
                                            item.data?.fields?.principal,
                                        )} IOTA
                                    {:else if item.label == "TimelockedStakedIota"}
                                        {item.label}: {nanoToIota(
                                            item.data.fields.staked_iota.fields
                                                .principal,
                                        )} IOTA
                                    {:else}
                                        {item.label}
                                    {/if}
                                </span>
                                {#if account.address !== item.currentOwner}
                                    <div>
                                        from: {item.currentOwner.slice(0, 6) +
                                            "..." +
                                            item.currentOwner.slice(-4)}
                                    </div>
                                {/if}
                            </div>
                            <div class="item">
                                <details>
                                    <summary>Show object data</summary>
                                    <pre
                                        style="font-size:0.7rem;  text-align: left;">
                                    {"\n" + JSON.stringify(item.data, null, 2)}
                                </pre>
                                </details>
                            </div>
                        </div>
                    {/each}
                    {#if account.objects.length == 0}
                        <br />
                        <br />
                        <br />
                        <br />
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</main>

<style>
    .value,
    pre {
        text-align: left;
        white-space: pre-wrap;
        word-break: break-all;
    }
    button {
        margin: 0.5rem;
    }

    .grid {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    .account {
        border: 2px solid #535353;
        width: 400px;
        min-height: 350px;
    }
    .handle {
        background-color: #232324;
    }
</style>
