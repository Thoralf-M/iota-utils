<script lang="ts">
    let bytes: any;
    let hex = "";
    let base58 = "";
    let base64 = "";
    let utf8 = "";
    let error = "";

    import { toHEX, fromB58, toB58, fromB64, toB64 } from "@iota/bcs";

    enum SourceType {
        Bytes,
        Hex,
        Base58,
        Base64,
        UTF8,
    }

    function convert(source: SourceType) {
        error = "";
        try {
            let sourceBytes: any;
            switch (+source) {
                case SourceType.Bytes:
                    let bytes_strings = bytes.trim().split(",");
                    let parsedBytes = [];
                    for (let byte_string of bytes_strings) {
                        if (Number.isInteger(parseInt(byte_string))) {
                            parsedBytes.push(parseInt(byte_string, 10));
                        }
                    }
                    sourceBytes = parsedBytes;
                    break;
                case SourceType.Hex:
                    if (hex.length % 2 != 0) {
                        return;
                    }
                    sourceBytes = hexToBytes(hex);
                    break;
                case SourceType.Base58:
                    sourceBytes = fromB58(base58);
                    break;
                case SourceType.Base64:
                    sourceBytes = fromB64(base64);
                    break;
                case SourceType.UTF8:
                    sourceBytes = new TextEncoder().encode(utf8);
                    break;
            }
            if (source != SourceType.Bytes) {
                bytes = sourceBytes;
            }
            hex = toHEX(sourceBytes);
            base58 = toB58(sourceBytes);
            base64 = toB64(sourceBytes);
            utf8 = bytesToUtf8(sourceBytes);
        } catch (err: any) {
            try {
                error = JSON.stringify(JSON.parse(err.message).payload.error);
            } catch (e: any) {
                error = err;
            }
        }
    }

    function hexToBytes(hex: string) {
        var re = /^(0[xX])?[A-Fa-f0-9]+$/;

        if (!re.test(hex)) {
            console.error("invalid hex");
            throw "invalid hex";
        }

        if (hex.toLowerCase().startsWith("0x")) {
            hex = hex.slice(2, hex.length);
        }
        for (var bytes = [], c = 0; c < hex.length; c += 2) {
            let int = parseInt(hex.substr(c, 2), 16);
            bytes.push(int);
        }
        return bytes;
    }

    function bytesToUtf8(bytes: number[]) {
        let bytes_utf8 = new TextDecoder().decode(new Uint8Array(bytes));
        return bytes_utf8;
    }
</script>

<main>
    <div class="wrapper">
        <div class="box">Bytes:</div>
        <div class="box">
            <input
                type="string"
                size="160"
                bind:value={bytes}
                on:input={() => convert(SourceType.Bytes)}
                placeholder="bytes like: 1, 2, 3"
            />
        </div>

        <div class="box">Hex:</div>
        <div class="box">
            <input
                type="string"
                size="160"
                bind:value={hex}
                on:input={() => convert(SourceType.Hex)}
                placeholder="hex string"
            />
        </div>

        <div class="box">Base64:</div>
        <div class="box">
            <input
                type="string"
                size="160"
                bind:value={base64}
                on:input={() => convert(SourceType.Base64)}
                placeholder="base64 string"
            />
        </div>

        <div class="box">Base58:</div>
        <div class="box">
            <input
                type="string"
                size="160"
                bind:value={base58}
                on:input={() => convert(SourceType.Base58)}
                placeholder="base58 string"
            />
        </div>

        <div class="box">UTF-8:</div>
        <div class="box">
            <input
                type="string"
                size="160"
                bind:value={utf8}
                on:input={() => convert(SourceType.UTF8)}
                placeholder="UTF-8 string"
            />
        </div>
    </div>

    <br />
    {error}
</main>

<style>
    .wrapper {
        display: grid;
        grid-template-columns: repeat(2, auto);
        text-align: left;
    }
    .box {
        padding: 2px;
    }
</style>
