const PORTAL_URL = "https://cmsweb.cms.cpp.edu";

function populateRatings() {
  console.log("BroncoDirect+: Loading ratings");

  // Ensure this script is running on BroncoDirect.
  if (window.location.origin !== PORTAL_URL) {
    console.log("Failed to load ratings; not in BroncoDirect Portal.");
    return;
  }

  // Find the table element that contains all the courses.
  const coursesTable = document.getElementById("ACE_$ICField$4$$0");
  if (coursesTable === null) {
    alert("Failed to find courses. Please try again by reloading the page.");
    return;
  }

  // Since `coursesTable.rows` returns a HTMLCollection
  // we need to convert our HTMLCollection into an array so we have access to array functions.
  // Each rows in `coursesTable` are courses; therefore the child of the courses would be the section.
  const courses = [...coursesTable.rows];

  // All the courses will be stored in `classes` as array of objects.
  // The object will contains the following:
  /*
    FIELDS:
    Class
    Course
    Days Time
    Instructor
    Meeting Dates
    Room
    Section

    EXAMPLE:
    Class: "34782"
    Course: "CS 4700.02"
    Days Times: "TuTh 2:30PM - 3:45PM"
    Instructor: "Deric Kwok"
    Meeting Dates: "01/21/2023 - 05/12/2023"
    Room: "Bldg 8 Rm 4"
    Section: "02-LEC Regular"
  */
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
        // Appends it onto the `classes` array and unions the current
        // course's data with a modified version of the Course's name.
        // This way all courses within the classes array has unique Course's key.
        classes.push(Object.assign({
          Course: `${courseTag.trim()}.${sectionNumber}`
        }, data));
      }

    });
  });

  let instructorSet = new Set();

  classes.forEach((course) => {
    if (course["Instructor"] !== "To be Announced") {
      // Instantiated a set, so I don't get duplicate of the same instructor.
      instructorSet.add(course["Instructor"]);
    }
  });

  // Convert back into an array.
  let instructors = Array.from(instructorSet);

  (async function() {
    // Make an request to my proxy server to fetch data from RateMyProfessor.
    // An proxy server is needed to bypass CORS.
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

            // Ensure if the `ratingElement` exist, we don't append it once again.
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

// MutationObserver is needed since the student enrollment page doesn't reload the page.
// Which causes issues with the extension since scripts only runs rigt after the DOM finish rendering.
// The BroncoDirect actually appends an iFrame when the user navigates to the Enrollment section.
// Therefore, we need an observer to detect when new nodes are appended within the iFrame.
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