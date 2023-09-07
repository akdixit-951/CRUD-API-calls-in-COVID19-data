const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertStateReportDbObjectToResponseObject = (dbObject) => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  };
};

// Get States API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

//Get State based on stateId API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
      SELECT
       *
      FROM
       state
      WHERE
       state_id = ${stateId}`;
  const state = await db.get(getStateQuery);
  response.send(convertStateDbObjectToResponseObject(state));
});

// Add Districts API
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO
      district (district_name,state_id,cases,cured,active,deaths)
    VALUES
      (
        '${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths}
      );`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//Get District based on districtId API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
      SELECT
       *
      FROM
       district
      WHERE
       district_id = ${districtId}`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictDbObjectToResponseObject(district));
});

//Delete District API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM
      district
    WHERE
      district_id = ${districtId}`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Update District API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE
      district
    SET
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    WHERE
      district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// get State Report API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateReportQuery = `
    SELECT
      sum(cases) AS cases,
      sum(cured) AS cured,
      sum(active) AS active,
      sum(deaths) AS deaths
    FROM
      district
    WHERE
      state_id = ${stateId}`;
  const stateReport = await db.get(getStateReportQuery);
  response.send(convertStateReportDbObjectToResponseObject(stateReport));
});

// get State based on district_id
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateDetailsQuery = `
    SELECT
      state_name
    FROM
      state JOIN district
      ON state.state_id = district.state_id
    WHERE
      district.district_id = ${districtId}`;
  const stateName = await db.get(getStateDetailsQuery);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;
