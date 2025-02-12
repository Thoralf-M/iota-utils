<script lang="ts">
    import WebWallet from "./WebWallet.svelte";
    import { onMount } from "svelte";
    import {
        activeAddress,
        iota_accounts,
        iota_wallets,
    } from "./SignerData.svelte";
    import { decodeIotaPrivateKey, Keypair } from "@iota/iota-sdk/cryptography";
    import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
    import { Secp256k1Keypair } from "@iota/iota-sdk/keypairs/secp256k1";
    import { Secp256r1Keypair } from "@iota/iota-sdk/keypairs/secp256r1";
    import { getClient } from "./Client.svelte";
    import type { Transaction } from "@iota/iota-sdk/transactions";
    import type { IotaTransactionBlockResponseOptions } from "@iota/iota-sdk/client";

    class PrivateKeyAccount {
        privKey: string;
        address: string;

        constructor(privKey: string) {
            const keypair = keypairFromBech32PrivateKey(privKey);
            const address = keypair.toIotaAddress();
            this.privKey = privKey;
            this.address = address;
        }

        async signAndExecuteTransaction(params: any) {
            const keypair = keypairFromBech32PrivateKey(this.privKey);
            let client = await getClient();
            return client.signAndExecuteTransaction({
                transaction: params.transaction,
                signer: keypair,
                options: params.options,
            });
        }
    }

    enum Signer {
        WebWallet = "WebWallet",
        Localstorage = "Localstorage",
    }
    let selectedSigner: Signer =
        (localStorage.getItem("selectedSigner")! as Signer) || Signer.WebWallet;
    function updateSelectedSignerAndAccounts() {
        localStorage.setItem("selectedSigner", selectedSigner);
        if (selectedSigner == Signer.Localstorage) {
            updateAccountsWithPrivateKeys(privateKeys);
        } else {
            $iota_accounts = [];
            $activeAddress = "";
        }
    }

    let webWalletComponent: WebWallet;
    let connectWallet: any;
    onMount(function () {
        connectWallet = function () {
            webWalletComponent.connectWallet();
        };
    });

    interface PrivateKeys {
        selected: string;
        keys: string[];
    }

    let privateKeys: PrivateKeys = JSON.parse(
        localStorage.getItem("privateKeys")!,
    ) || {
        selected: "",
        keys: [],
    };
    // Init the first time if localstorage is selected
    if (selectedSigner == Signer.Localstorage) {
        updateAccountsWithPrivateKeys(privateKeys);
    }

    let jsonPrivateKeysString = JSON.stringify(privateKeys, null, 2);
    function handlePrivateKeysChange() {
        try {
            privateKeys = JSON.parse(jsonPrivateKeysString);
            if (
                !privateKeys.hasOwnProperty("selected") ||
                !privateKeys.hasOwnProperty("keys")
            ) {
                alert("Missing selected or keys properties");
            } else {
                updateAccountsWithPrivateKeys(privateKeys);
                localStorage.setItem(
                    "privateKeys",
                    JSON.stringify(privateKeys),
                );
            }
        } catch (e) {
            console.error("Invalid JSON", e);
        }
    }
    function updateAccountsWithPrivateKeys(privateKeys: PrivateKeys) {
        $iota_accounts = [];
        for (let privKey of privateKeys.keys) {
            // @ts-ignore
            $iota_accounts.push(new PrivateKeyAccount(privKey));
        }

        if (privateKeys.selected == "") {
            privateKeys.selected = $iota_accounts.find(
                (a) => a.address == $activeAddress,
                // @ts-ignore
            )!.privKey;
        }
        // This is a hack to get the signer working with the same interface as the web wallet, should be refactored
        // @ts-ignore
        $iota_wallets[0] = new PrivateKeyAccount(privateKeys.selected);
        $activeAddress = keypairFromBech32PrivateKey(
            privateKeys.selected,
        ).toIotaAddress();
    }

    function keypairFromBech32PrivateKey(bech32privateKey: string): Keypair {
        const decoded = decodeIotaPrivateKey(bech32privateKey);
        const schema = decoded.schema;
        const secretKey = decoded.secretKey;
        switch (schema) {
            case "ED25519":
                return Ed25519Keypair.fromSecretKey(secretKey);
            case "Secp256k1":
                return Secp256k1Keypair.fromSecretKey(secretKey);
            case "Secp256r1":
                return Secp256r1Keypair.fromSecretKey(secretKey);
            default:
                throw new Error(`Invalid keypair schema ${schema}`);
        }
    }
</script>

<WebWallet bind:this={webWalletComponent} />

Signer:
<select
    bind:value={selectedSigner}
    on:change={() => updateSelectedSignerAndAccounts()}
>
    {#each Object.values(Signer) as signer}
        <option value={signer}>{signer}</option>
    {/each}
</select>

<p>
    Active address:
    <select
        bind:value={$activeAddress}
        on:change={() => {
            activeAddress.set($activeAddress);
            if (selectedSigner == Signer.Localstorage) {
                privateKeys.selected = $iota_accounts.find(
                    (a) => a.address == $activeAddress,
                    // @ts-ignore
                )!.privKey;
                localStorage.setItem(
                    "privateKeys",
                    JSON.stringify(privateKeys),
                );
                jsonPrivateKeysString = JSON.stringify(privateKeys, null, 2);
            }
        }}
    >
        {#each $iota_accounts as account}
            <option value={account.address}>
                {account.address}
            </option>
        {/each}
    </select>
</p>

{#if selectedSigner == Signer.WebWallet}
    <button on:click={() => connectWallet()}> Connect web wallet </button>
{:else}
    <textarea
        bind:value={jsonPrivateKeysString}
        on:input={handlePrivateKeysChange}
        rows="8"
        cols="100"
    ></textarea>
{/if}
