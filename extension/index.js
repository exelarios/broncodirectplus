const PORTAL_URL = "https://cmsweb.cms.cpp.edu";

function populateRatings() {
  console.log("BroncoDirect+: Loading ratings");
  if (window.location.origin !== PORTAL_URL) {
    return;
  }

  const coursesTable = document.getElementById("ACE_$ICField$4$$0");
  if (coursesTable === null) {
    return;
  }

  const courses = [...coursesTable.rows];

  let classes = [];

  courses.forEach((course) => {
    const sections = course.querySelectorAll(".PSLEVEL1GRIDNBONBO");
    const courseTitle = course.querySelector(".ui-collapsible-heading-toggle");
    const [courseTag, courseName] = courseTitle.innerText.split("-");
    sections.forEach((section) => {
      const content = section.rows[1];
      const fields = [...content.children];
      const data = {};
      fields.forEach((field) => {
        const heading = field.querySelector(".gh-table-cell-label");
        const value = field.querySelector(".PSLONGEDITBOX") || field.querySelector(".PSHYPERLINK a");
        const headingLabel = heading?.innerHTML.replace("&amp; ", "");
        if (headingLabel && value?.innerText) {
          data[headingLabel] = value.innerText.replace("\n", " ");
        }
      });
      if (data["Section"]) {
        const [sectionNumber, sectionType] = data["Section"].split("-");
        classes.push(Object.assign({
          Course: `${courseTag.trim()}.${sectionNumber}`
        }, data));
      }
    });
  });

  let instructorSet = new Set();
  classes.forEach((course) => {
    if (course["Instructor"] !== "To be Announced") {
      instructorSet.add(course["Instructor"]);
    }
  });

  let instructors = Array.from(instructorSet);

  (async function() {
    const response = await fetch("https://broncodirectplus.vercel.app/api/teachers", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "teachers": instructors
      })
    });

    const proxyResponse = await response.json();
    const { success, payload } = proxyResponse;
    console.log(payload);
    if (success) {
      courses.forEach((course) => {
        const sections = course.querySelectorAll(".PSLEVEL1GRIDNBONBO");
        sections.forEach((section) => {
          const content = section.rows[1];
          const instructorElement = content.children[4]
          const instructorName = instructorElement.querySelector(".PSLONGEDITBOX");
          const teacherRatings = payload[instructorName.innerText];
          if (instructorName && teacherRatings) {
            const {name, avgRating, numRatings, legacyId } = teacherRatings;
            const ratingElement = document.createElement("a");
            ratingElement.target = "_blank";
            ratingElement.href = `https://www.ratemyprofessors.com/professor?tid=${legacyId}`
            ratingElement.innerText = `${avgRating} / 5`;

            if (!instructorElement.contains(ratingElement)) {
              instructorElement.append(ratingElement);
            }
          }
        });
      });
    }
  })();
}

const mainContent = document.querySelector("#gh-main-content");

const observer = new MutationObserver(function (mutations) {
  mutations.forEach((mutation) => {
    for (const node of mutation.addedNodes) {
      if (node.id === "win0divSSR_CLSRSLT_WRK_GROUPBOX1") {
        populateRatings();
      }
    }
  })
});

observer.observe(mainContent, {
  childList: true,
  subtree: true
});