const { default: TeamsTable } = require("./TeamsTable");

function page() {
  return (
    <div>
      <h1>Teams</h1>
      <TeamsTable />
    </div>
  );
}

export default page;
