<script lang="ts">
    import JSONTree from "@sveltejs/svelte-json-tree";
    import { getClient } from "../Client.svelte";

    let value = {};
    let apiVersion = "";
    const getLatestSystemState = async () => {
        try {
            let client = await getClient();
            apiVersion = (await client.getRpcApiVersion()) || "";
            const systemState = await client.getLatestIotaSystemState();
            console.log(systemState);
            value = systemState;
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    };
    let showAllValidatorData = false;
    const getCandidateValidators = async () => {
        try {
            let client = await getClient();
            apiVersion = (await client.getRpcApiVersion()) || "";
            const systemState = await client.getLatestIotaSystemState();

            const validatorCandidatesId = systemState.validatorCandidatesId;
            let hasNextPage = true;
            let nextPageCursor;
            let validatorCandidates = [];
            while (hasNextPage) {
                const candidateValidatorsPage = await client.getDynamicFields({
                    parentId: validatorCandidatesId,
                    cursor: nextPageCursor,
                });
                for (const candidateValidator of candidateValidatorsPage.data) {
                    const validatorWrapper = await client.getDynamicFieldObject(
                        {
                            parentId: validatorCandidatesId,
                            name: candidateValidator.name,
                        },
                    );
                    const validatorV1 = await client.getDynamicFields({
                        parentId:
                            // @ts-ignore
                            validatorWrapper.data?.content.fields.value.fields
                                .inner.fields.id.id,
                    });
                    const validatorObject = await client.getObject({
                        id: validatorV1.data[0].objectId,
                        options: { showContent: true },
                    });

                    const validator =
                        // @ts-ignore
                        validatorObject.data?.content.fields.value.fields;
                    if (!showAllValidatorData) {
                        cleanupValidatorFields(validator);
                    }
                    validatorCandidates.push(validator);
                    value = validatorCandidates;
                }
                hasNextPage = candidateValidatorsPage.hasNextPage;
                if (hasNextPage) {
                    nextPageCursor = candidateValidatorsPage.nextCursor;
                }
            }
            if (validatorCandidates.length == 0) {
                value = "No candidate validators";
            }
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    };
    const getPendingValidators = async () => {
        try {
            let client = await getClient();
            apiVersion = (await client.getRpcApiVersion()) || "";
            const systemState = await client.getLatestIotaSystemState();
            const pendingActiveValidatorsId =
                systemState.pendingActiveValidatorsId;

            let hasNextPage = true;
            let nextPageCursor;
            let pendingValidators = [];
            while (hasNextPage) {
                const pendingValidatorsPage = await client.getDynamicFields({
                    parentId: pendingActiveValidatorsId,
                    cursor: nextPageCursor,
                });
                for (const pendingValidator of pendingValidatorsPage.data) {
                    const validatorObject = await client.getObject({
                        id: pendingValidator.objectId,
                        options: { showContent: true },
                    });

                    const validator =
                        // @ts-ignore
                        validatorObject.data?.content.fields.value.fields;
                    if (!showAllValidatorData) {
                        cleanupValidatorFields(validator);
                    }
                    pendingValidators.push(validator);
                    value = pendingValidators;
                }
                hasNextPage = pendingValidatorsPage.hasNextPage;
                if (hasNextPage) {
                    nextPageCursor = pendingValidatorsPage.nextCursor;
                }
            }
            if (pendingValidators.length == 0) {
                value = "No pending validators";
            }
        } catch (err: any) {
            value = err.toString();
            console.error(err);
        }
    };
    // Remove fields from the validator to have a cleaner output
    function cleanupValidatorFields(validator: any) {
        delete validator.extra_fields;
        delete validator.metadata.type;
        delete validator.metadata.fields.authority_pubkey_bytes;
        delete validator.metadata.fields.next_epoch_authority_pubkey_bytes;
        delete validator.metadata.fields.next_epoch_net_address;
        delete validator.metadata.fields.next_epoch_network_pubkey_bytes;
        delete validator.metadata.fields.next_epoch_p2p_address;
        delete validator.metadata.fields.next_epoch_primary_address;
        delete validator.metadata.fields.next_epoch_proof_of_possession;
        delete validator.metadata.fields.next_epoch_protocol_pubkey_bytes;
        delete validator.metadata.fields.net_address;
        delete validator.metadata.fields.p2p_address;
        delete validator.metadata.fields.primary_address;
        delete validator.metadata.fields.image_url;
        delete validator.metadata.fields.extra_fields;
        delete validator.metadata.fields.network_pubkey_bytes;
        delete validator.metadata.fields.proof_of_possession;
        delete validator.metadata.fields.protocol_pubkey_bytes;
        delete validator.staking_pool.type;
        delete validator.staking_pool.fields.exchange_rates;
        delete validator.staking_pool.fields.extra_fields;
        delete validator.staking_pool.fields.id;
    }
    let showJsonTree = true;
</script>

<main>
    <button on:click={() => getLatestSystemState()}>
        get latest IOTA system state
    </button>
    <button on:click={() => getCandidateValidators()}>
        candidate validators
    </button>
    <button on:click={() => getPendingValidators()}>
        pending validators
    </button>
    show full data (set before requesting):
    <select bind:value={showAllValidatorData}>
        <option value={true}>{true}</option>
        <option value={false}>{false}</option>
    </select>

    <div class="value" hidden={Object.keys(value).length == 0}>
        <div>
            API Version: {apiVersion}
        </div>
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
