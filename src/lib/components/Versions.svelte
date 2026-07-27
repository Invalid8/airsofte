<script lang="ts">
  const versions = [
    ['Airsofte', 'v1.1.3'],
    ['Runtime', 'Tauri']
  ]
</script>

<ul class="versions">
  {#each versions as [name, version]}
    <li>{name} {version}</li>
  {/each}
</ul>
