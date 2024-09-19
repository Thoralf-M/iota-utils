<script lang="ts">
    export let items: any[] = [];
    let activeTabs = [0];

    const handleClick = (tabValue: number) => () => {
        activeTabs[0] = tabValue;
        // Commented part could be used to have multiple tabs at once visible
        // if (activeTabs.includes(tabValue)) {
        //     activeTabs = activeTabs.filter((v) => v != tabValue);
        // } else {
        //     activeTabs = [...activeTabs, tabValue];
        // }
    };
</script>

<ul>
    {#each items as item}
        <li class={activeTabs.includes(item.value) ? "active" : ""}>
            <button on:click={handleClick(item.value)}>{item.label}</button>
        </li>
    {/each}
</ul>

{#each items as item}
    <div class="box" hidden={!activeTabs.includes(item.value)}>
        <svelte:component this={item.component} />
    </div>
{/each}

<style>
    .box {
        margin-bottom: 10px;
        padding: 40px;
        border: 1px solid #dee2e6;
        border-radius: 0 0 0.5rem 0.5rem;
        border-top: 0;
    }
    ul {
        display: flex;
        flex-wrap: wrap;
        padding-left: 0;
        margin-bottom: 0;
        list-style: none;
        border-bottom: 1px solid #dee2e6;
    }
    li {
        margin-bottom: -1px;
    }

    button {
        border: 1px solid transparent;
        border-top-left-radius: 0.25rem;
        border-top-right-radius: 0.25rem;
        border-bottom-left-radius: 0rem;
        border-bottom-right-radius: 0rem;
        display: block;
        padding: 0.5rem 1rem;
        cursor: pointer;
    }

    button:hover {
        border-color: #e9ecef #e9ecef #dee2e6;
    }

    li.active > button {
        color: #495057;
        background-color: #fff;
        border-color: #dee2e6 #dee2e6 #fff;
    }
</style>
