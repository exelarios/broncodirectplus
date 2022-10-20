const coursesTable = document.getElementById("ACE_$ICField$4$$0");

const PORTAL = "https://cmsweb.cms.cpp.edu/";

// if (window.location.hostname !== PORTAL) {
//   return null;
// }

if (!coursesTable) {
  console.warn("Failed to find courses from DOM");
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
  const response = await fetch("http://localhost:5050/api/teachers", {
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

          instructorElement.append(ratingElement);
        }
      });
    });
  }
})();