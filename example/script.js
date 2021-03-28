const schoolDbSetup = () => {
  const increaseViewHeight = document.querySelector("#increase-view-height");
  const increaseViewWidth = document.querySelector("#increase-view-width");
  const decreaseViewHeight = document.querySelector("#decrease-view-height");
  const decreaseViewWidth = document.querySelector("#decrease-view-width");
  const dbViewerSchoolElem = document.querySelector("#school-db");

  dbViewerSchoolElem.addEventListener("ready", () => {
    // dbViewerSchoolElem.scrollLeft = 1000;
    // dbViewerSchoolElem.scrollTop = 1000;
    // dbViewerSchoolElem.zoomIn();
    // dbViewerSchoolElem.zoomIn();
  });

  dbViewerSchoolElem.addEventListener("load", () => {
    // dbViewerSchoolElem.setTablePos('school', 0, 0);
    console.log(dbViewerSchoolElem.getTableInfo("school"));
    console.log(dbViewerSchoolElem.schema);
  });

  dbViewerSchoolElem.addEventListener("ready", () => console.log("ready"));

  dbViewerSchoolElem.addEventListener("ready", () => {
    fetch("./example/schema/school.json")
      .then((response) => response.json())
      .then((data) => {
        increaseViewHeight.addEventListener("click", () => {
          if (data.viewHeight) data.viewHeight += 500;
          else data.viewHeight = 5500;
          data.viewport = "noChange";
          dbViewerSchoolElem.schema = data;
        });
        increaseViewWidth.addEventListener("click", () => {
          if (data.viewWidth) data.viewWidth += 500;
          else data.viewWidth = 5500;
          data.viewport = "noChange";
          dbViewerSchoolElem.schema = data;
        });
        decreaseViewHeight.addEventListener("click", () => {
          if (data.viewHeight) data.viewHeight -= 500;
          else data.viewHeight = 4500;
          data.viewport = "noChange";
          dbViewerSchoolElem.schema = data;
        });
        decreaseViewWidth.addEventListener("click", () => {
          if (data.viewWidth) data.viewWidth -= 500;
          else data.viewWidth = 4500;
          data.viewport = "noChange";
          dbViewerSchoolElem.schema = data;
        });
        dbViewerSchoolElem.schema = data;
      });

    dbViewerSchoolElem.addEventListener("tableClick", (event) =>
      console.log("tableClick", event.detail)
    );
    dbViewerSchoolElem.addEventListener("tableDblClick", (event) =>
      console.log("tableDblClick", event.detail)
    );
    dbViewerSchoolElem.addEventListener("tableContextMenu", (event) =>
      console.log("tableContextMenu", event.detail)
    );

    dbViewerSchoolElem.addEventListener("relationClick", (event) =>
      console.log("relationClick", event.detail)
    );
    dbViewerSchoolElem.addEventListener("relationDblClick", (event) =>
      console.log("relationDblClick", event.detail)
    );
    dbViewerSchoolElem.addEventListener("relationContextMenu", (event) =>
      console.log("relationContextMenu", event.detail)
    );

    dbViewerSchoolElem.addEventListener("tableMove", (event) =>
      console.log("tableMove", event.detail)
    );
    dbViewerSchoolElem.addEventListener("tableMoveEnd", (event) =>
      console.log("tableMoveEnd", event.detail)
    );
    dbViewerSchoolElem.addEventListener("zoomIn", (event) =>
      console.log("zoomIn", event.detail)
    );
    dbViewerSchoolElem.addEventListener("zoomOut", (event) =>
      console.log("zoomOut", event.detail)
    );
    dbViewerSchoolElem.addEventListener("scroll", (event) =>
      console.log("scroll", event.detail)
    );
  });
};

document.addEventListener(
  "DOMContentLoaded",
  () => {
    schoolDbSetup();
  },
  false
);
