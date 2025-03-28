<script lang="ts">
    import {
        Ed25519Keypair,
        Ed25519PublicKey,
    } from "@iota/iota-sdk/keypairs/ed25519";
    import { derivePath } from "./ed25519-hd-key";
    import { decodeIotaPrivateKey } from "@iota/iota-sdk/cryptography";
    import { fromB64, fromHEX, toB64, toHEX } from "@iota/bcs";
    import {
        entropyToMnemonic,
        generateMnemonic,
        mnemonicToEntropy,
        mnemonicToSeedSync,
    } from "@scure/bip39";
    import { wordlist } from "@scure/bip39/wordlists/english";

    const IOTA_BIP44_COIN_TYPE = 4218;
    const SHIMMER_BIP44_COIN_TYPE = 4219;
    const TESTNET_BIP44_COIN_TYPE = 1;
    let coinType = IOTA_BIP44_COIN_TYPE;
    let accountIndex = 0;
    let change = 0;
    let addressIndex = 0;

    let mnemonic = "";
    let mnemonicEntropy = "";
    let seed = "";
    let privateKeyBech32 = "";
    let privateKeyHex = "";
    let publicKeyBase64 = "";
    let publicKey = "";
    let address = "";
    let error = "";

    const generate = () => {
        tryCatch(generateInner);
    };
    const generateInner = () => {
        // 256 for 24 words
        mnemonic = generateMnemonic(wordlist, 256);
        generateAddressFromMnemonic();
    };
    const generateShort = () => {
        tryCatch(generateShortInner);
    };
    const generateShortInner = () => {
        mnemonic = "";
        while (mnemonic.length == 0 || mnemonic.length > 129) {
            mnemonic = generateMnemonic(wordlist, 256);
        }
        generateAddressFromMnemonic();
    };
    const generateFromEntropy = () => {
        tryCatch(generateFromEntropyInner);
    };
    const generateFromEntropyInner = () => {
        mnemonic = entropyToMnemonic(fromHEX(mnemonicEntropy), wordlist);
        generateSeedAndAddress();
    };

    const generateAddressFromMnemonic = () => {
        tryCatch(generateAddressFromMnemonicInner);
    };
    const generateAddressFromMnemonicInner = () => {
        mnemonicEntropy = toHEX(mnemonicToEntropy(mnemonic, wordlist));
        generateSeedAndAddress();
    };
    const generateSeedAndAddress = () => {
        tryCatch(generateSeedAndAddressInner);
    };
    const generateSeedAndAddressInner = () => {
        // empty passphrase
        seed = toHEX(mnemonicToSeedSync(mnemonic, ""));
        generateAddressFromSeed();
    };

    const generateAddressFromSeed = () => {
        tryCatch(generateAddressFromSeedInner);
    };
    const generateAddressFromSeedInner = () => {
        let keyPair = deriveKeypairFromSeed(
            seed,
            `m/44'/${coinType}'/${accountIndex}'/${change}'/${addressIndex}'`,
        );
        privateKeyBech32 = keyPair.getSecretKey();
        // @ts-ignore
        privateKeyHex = toHEX(keyPair.keypair.secretKey.slice(0, 32));
        generatePublicKey(keyPair);
    };

    const generateKeysFromHexPrivateKey = () => {
        tryCatch(generateKeysFromHexPrivateKeyInner);
    };
    const generateKeysFromHexPrivateKeyInner = () => {
        let keyPair = Ed25519Keypair.fromSecretKey(fromHEX(privateKeyHex));
        privateKeyBech32 = keyPair.getSecretKey();
        generatePublicKey(keyPair);
    };

    const generateKeysFromBech32PrivateKey = () => {
        tryCatch(generateKeysFromBech32PrivateKeyInner);
    };
    const generateKeysFromBech32PrivateKeyInner = () => {
        const { schema, secretKey } = decodeIotaPrivateKey(privateKeyBech32);
        if (schema != "ED25519") {
            throw "unsupported schema: " + schema;
        }
        // use schema to choose the correct key pair
        const keyPair = Ed25519Keypair.fromSecretKey(secretKey);
        // @ts-ignore
        privateKeyHex = toHEX(keyPair.keypair.secretKey.slice(0, 32));
        generatePublicKey(keyPair);
    };

    const generatePublicKey = (keyPair: Ed25519Keypair) => {
        error = "";
        try {
            publicKeyBase64 = toB64(keyPair.getPublicKey().toRawBytes());
            publicKey = toHEX(keyPair.getPublicKey().toRawBytes());
            address = keyPair.getPublicKey().toIotaAddress();
        } catch (err: any) {
            try {
                error = JSON.stringify(JSON.parse(err.message).payload.error);
            } catch (e: any) {
                error = err;
            }
        }
    };

    const addressFromPublicKeyBase64 = () => {
        tryCatch(addressFromPublicKeyBase64Inner);
    };
    const addressFromPublicKeyBase64Inner = () => {
        let bytes = fromB64(publicKeyBase64);
        // Remove byte flag if existing
        if (bytes.length == 33) {
            bytes = bytes.slice(1);
        }
        publicKey = toHEX(bytes);
        address = new Ed25519PublicKey(bytes).toIotaAddress();
    };
    const addressFromPublicKey = () => {
        tryCatch(addressFromPublicKeyInner);
    };
    const addressFromPublicKeyInner = () => {
        let bytes = fromHEX(publicKey);
        publicKeyBase64 = toB64(bytes);
        address = new Ed25519PublicKey(bytes).toIotaAddress();
    };

    const tryCatch = (fn: any) => {
        error = "";
        try {
            fn();
        } catch (err: any) {
            try {
                error = JSON.stringify(JSON.parse(err.message).payload.error);
            } catch (e: any) {
                error = err;
            }
        }
    };

    // Workaround as `Ed25519Keypair.deriveKeypairFromSeed()` is limited to coin type 4218
    function deriveKeypairFromSeed(
        seedHex: string,
        path: string,
    ): Ed25519Keypair {
        const { key } = derivePath(path, seedHex);
        return Ed25519Keypair.fromSecretKey(key);
    }
</script>

<main>
    <div>For development purposes only, never use with real funds!</div>
    <br />
    <button on:click={() => generate()}>Generate new</button>
    <button on:click={() => generateShort()}
        >Generate new short (&#60;130 chars)</button
    >
    <input
        type="string"
        size="140"
        bind:value={mnemonic}
        on:input={() => generateAddressFromMnemonic()}
        placeholder="24 word BIP-39 mnemonic. For development purposes only, never use with real funds!"
    />
    <br />

    BIP 44 path:
    <input
        type="number"
        list="coinTypes"
        bind:value={coinType}
        placeholder="BIP-44 coin type"
        on:input={() => generateAddressFromSeed()}
    />
    <datalist id="coinTypes">
        <option value={IOTA_BIP44_COIN_TYPE}>IOTA </option>
        <option value={SHIMMER_BIP44_COIN_TYPE}>Shimmer </option>
        <option value={TESTNET_BIP44_COIN_TYPE}>Testnet </option>
    </datalist>

    <input
        type="number"
        min="0"
        bind:value={accountIndex}
        placeholder="account index"
        on:input={() => generateAddressFromSeed()}
    />
    <select bind:value={change} on:input={() => generateAddressFromSeed()}>
        <option value={0}>0</option>
        <option value={1}>1</option>
    </select>
    <input
        type="number"
        width="1"
        min="0"
        bind:value={addressIndex}
        placeholder="address index"
        on:input={() => generateAddressFromSeed()}
    />

    <br />
    <div>Insert anything and it will generate/convert what's possible:</div>
    <div>
        Mnemonic entropy: &nbsp;&nbsp;<input
            type="string"
            size="70"
            bind:value={mnemonicEntropy}
            on:input={() => generateFromEntropy()}
            placeholder="hex mnemonic entropy"
        />
    </div>
    <div>
        Seed:
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input
            type="string"
            size="130"
            bind:value={seed}
            on:input={() => generateAddressFromSeed()}
            placeholder="hex seed"
        />
    </div>
    <div>
        Private key bech32:&nbsp;<input
            type="string"
            size="75"
            bind:value={privateKeyBech32}
            on:input={() => generateKeysFromBech32PrivateKey()}
            placeholder="bech32 iotaprivkey"
        />
    </div>
    <div>
        Private key hex: &nbsp;&nbsp;&nbsp;<input
            type="string"
            size="70"
            bind:value={privateKeyHex}
            on:input={() => generateKeysFromHexPrivateKey()}
            placeholder="hex Ed25519 private key"
        />
    </div>
    <div>
        Public key base64:&nbsp;&nbsp;<input
            type="string"
            size="70"
            bind:value={publicKeyBase64}
            on:input={() => addressFromPublicKeyBase64()}
            placeholder="base64 Ed25519 public key"
        />
    </div>
    <div>
        Public key:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input
            type="string"
            size="70"
            bind:value={publicKey}
            on:input={() => addressFromPublicKey()}
            placeholder="hex Ed25519 public key"
        />
    </div>
    <div>
        Address:
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{address}
    </div>
    <br />
    {error}
</main>

<style>
    div {
        display: flex;
    }

    input[type="number"] {
        width: 5rem;
    }
</style>
