<script lang="ts">
    let bytes: any;
    let hex = "";
    let base58 = "";
    let base64 = "";
    let utf8 = "";
    let u64 = "";
    let error = "";

    let transaction: any;

    let nano = "";
    let nanoWithUnderscore = "";
    let iota = "";
    let iotaWithUnderscore = "";

    import { toHEX, fromB58, toB58, fromB64, toB64, bcs } from "@iota/bcs";
    import { bcs as IotaBcs } from "@iota/iota-sdk/bcs";
    import { IOTA_DECIMALS, NANOS_PER_IOTA } from "@iota/iota-sdk/utils";
    import { TransactionDataBuilder } from "@iota/iota-sdk/transactions";

    enum SourceType {
        Bytes,
        Hex,
        Base58,
        Base64,
        UTF8,
        U64,
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
                case SourceType.U64:
                    sourceBytes = bcs.u64().serialize(u64).toBytes();
                    break;
            }
            if (source != SourceType.Bytes) {
                bytes = sourceBytes;
            }
            hex = toHEX(sourceBytes);
            base58 = toB58(sourceBytes);
            base64 = toB64(sourceBytes);
            utf8 = bytesToUtf8(sourceBytes);
            u64 = bcsBytesToU64(sourceBytes);
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

    function bcsBytesToU64(bytes: number[]) {
        return bcs.u64().parse(new Uint8Array(bytes));
    }

    function convertToIota() {
        error = "";
        try {
            if (nano) {
                iota = nanoToIota(nano);
                iotaWithUnderscore = iota.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1_");
                nanoWithUnderscore = nano.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1_");
            } else {
                iota = "";
            }
        } catch (err: any) {
            error = err;
        }
    }

    function convertToNano() {
        error = "";
        try {
            if (iota) {
                nano = iotaToNano(iota);
                iotaWithUnderscore = iota.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1_");
                nanoWithUnderscore = nano.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1_");
            } else {
                nano = "";
            }
        } catch (err: any) {
            error = err;
        }
    }
    
function iotaToNano(iota: string): string{
    const [intPart, decPart = ''] = iota.replace(/_/g, "").split('.');
    if (decPart.length > 9) {
        throw new Error('Decimal part exceeds 9 digits');
    }
  
  // Pad or trim the decimal part to 9 digits
  const paddedDec = (decPart + '0'.repeat(IOTA_DECIMALS)).slice(0, 9);
  
  // Combine the parts
  const combined = intPart + paddedDec;
  
  return BigInt(combined).toString();
}

function formatBigIntWithDecimal(bigint: BigInt, decimalPlaces: number): string {
  const str = bigint.toString();
  const len = str.length;

  if (len <= decimalPlaces) {
    // Pad with zeros on the left if necessary
    const padded = str.padStart(decimalPlaces, '0');
    return `0.${padded}`;
  }

  const intPart = str.slice(0, len - decimalPlaces);
  const decimalPart = str.slice(len - decimalPlaces);
  return `${intPart}.${decimalPart}`;
}

const nanoToIota = (nano: string) => {
    return formatBigIntWithDecimal(BigInt(nano.replace(/_/g, "")), IOTA_DECIMALS);
};


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

        <div class="box">u64 (from/to BCS bytes):</div>
        <div class="box">
            <input
                type="string"
                size="160"
                bind:value={u64}
                on:input={() => convert(SourceType.U64)}
                placeholder="u64 number"
            />
        </div>
    </div>
    <br />
    <div class="wrapper2">
        <div class="box">
            NANO:
            <input
                type="string"
                size="40"
                bind:value={nano}
                on:input={() => convertToIota()}
                placeholder="NANO amount"
            />
            {nanoWithUnderscore}
        </div>
        <div class="box">
            IOTA:
            <input
            type="string"
            size="40"
            bind:value={iota}
            on:input={() => convertToNano()}
            placeholder="IOTA amount"
            />
            {iotaWithUnderscore}
        </div>
    </div>
    <br />
    <div class="wrapper">
        <div class="box">Tx bytes base64:</div>
        <div class="box">
            <input
                type="string"
                size="160"
                on:input={(event) => {
                    // @ts-ignore
                    let inputString = event.target.value;
                    try {
                        transaction = TransactionDataBuilder.fromBytes(
                            fromB64(inputString),
                        );
                    } catch (e) {
                        console.log("error TransactionDataBuilder", e);
                        try {
                            transaction = IotaBcs.SenderSignedData.parse(
                                fromB64(inputString),
                            );
                        } catch (e) {
                            console.log("error SenderSignedData", e);
                            transaction = e;
                        }
                    }
                }}
                placeholder="base64 transaction bytes"
            />
        </div>
    </div>

    <pre>{JSON.stringify(transaction, null, 2)}</pre>
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
    pre {
        text-align: left;
    }
</style>
