const express = require("express");
const router = express.Router();

const { RMP } = require("../utils/endpoints");

const TeacherQuery = `
  query NewSearchTeacherQuery($query: TeacherSearchQuery!) {
    newSearch {
      teachers(query: $query) {
        edges {
          node {
            firstName
            lastName
            avgRatingRounded
            numRatings
            legacyId
          }
        }
      }
    }
  }
`;

router.post("/api/teachers", async (request, response) => {
  try {
    const { teachers } = request.body;
    if (!teachers) {
      throw new Error("Teachers' field wasn't provided within request body");
    }

    const data = teachers.map((teacherName) => {
      console.log(teacherName);
      return RMP.post("/graphql", {
        query: TeacherQuery,
        variables: {
          query: {
            text: teacherName,
            schoolID: "U2Nob29sLTE0Nzc0"
          }
        }
      });
    });

    const payload = await Promise.all(data);

    const output = {};
    payload.forEach((teacherAxiosResponse) => {
      const teacherGQLResponse = teacherAxiosResponse?.data;
      if (!teacherGQLResponse) {
        throw new Error("Failed to get Teacher's response data object.");
      }

      const { variables } = JSON.parse(teacherAxiosResponse.config.data);
      if (!variables) {
        throw new Error("Failed to fetch axios' request's body from response.");
      }

      const { text } = variables.query;

      const teacher = teacherGQLResponse.data.newSearch.teachers.edges[0]?.node;
      if (teacher) {
        output[text] = {
          name: text,
          avgRating: Math.round(teacher.avgRatingRounded * 100) / 100,
          numRatings: teacher.numRatings,
          legacyId: teacher.legacyId
        }
      }
    });

    response.send({
      success: true,
      payload: output
    });

  } catch(error) {
    response.send({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;