const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

after (function () {
  chai.request(server).get('/api')
})

suite('Functional Tests', function() {
  suite('POST /api/issues/{project}', function () {
    test("Every field filled in", function (done) {
      chai.request(server)
      .post('/api/issues/test')
      .send({
        issue_title: "title 1",
        issue_text: "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.",
        created_by: "sazk",
        assigned_to: "mod",
        status_text: "in QA"
      })
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.isObject(res.body)
        assert.equal(res.body.issue_title, "title 1")
        assert.equal(res.body.issue_text, "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.")
        assert.equal(res.body.created_by, "sazk")
        assert.equal(res.body.assigned_to, "mod")
        assert.equal(res.body.status_text, "in QA")
        assert.isTrue(res.body.open)
        assert.property(res.body, "_id")
        assert.isNumber(Date.parse(res.body.created_on))
        assert.isNumber(Date.parse(res.body.updated_on))
        done()
      })
    })
    test("Only required fields", function (done) {
      chai.request(server)
      .post('/api/issues/test')
      .send({
        project: "test",
        issue_title: "title 2",
        issue_text: "lorem 2",
        created_by: "sazk2"
      })
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.isObject(res.body)
        assert.include(res.body, {
          project: "test",
          issue_title: "title 2",
          issue_text: "lorem 2",
          created_by: "sazk2"
        })
        assert.isEmpty(res.body.assigned_to)
        assert.isEmpty(res.body.status_text)
        done()
      })
    })
    test("Missing required fields", function (done) {
      chai.request(server)
      .post('/api/issues/test')
      .send({
        issue_title: "missing required fields"
      })
      .end((err, res) => {
        assert.isObject(res.body)
        assert.equal(res.body.error, "required field(s) missing")
        done()
      })
    })
  })
  suite("GET /api/issues/{project}", function () {
    test("View issues on a project", function (done) {
      chai.request(server)
      .get('/api/issues/test')
      .query({})
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.isArray(res.body)
        assert.property(res.body[0], "issue_title")
        assert.property(res.body[0], "issue_text")
        assert.property(res.body[0], "created_by")
        assert.property(res.body[0], "assigned_to")
        assert.property(res.body[0], "status_text")
        assert.property(res.body[0], "open")
        assert.property(res.body[0], "_id")
        assert.property(res.body[0], "created_on")
        assert.property(res.body[0], "updated_on")
        done()
      })
    })
    test("View issues on a project with one filter", function (done) {
      chai.request(server)
      .get('/api/issues/test?open=true')
      .query('/api/issues/test?created_by=sazk')
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.isArray(res.body)
        assert.equal(res.body[0].created_by, "sazk")
        done()
      })
    })
    test("View issues on a project with multiple filters", function (done) {
      chai.request(server)
      .post('/api/issues/test')
      .send({
        issue_title: "title 3",
        issue_text: "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.",
        created_by: "sazk",
        status_text: "in QA"
      })
      .end()

      chai.request(server)
      .get('/api/issues/test?open=true')
      .query('/api/issues/test?created_by=sazk&status_text=in%20QA')
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.isArray(res.body)
        assert.equal(res.body[0].created_by, "sazk")
        assert.equal(res.body[1].created_by, "sazk")
        assert.equal(res.body[0].status_text, "in QA")
        assert.equal(res.body[1].status_text, "in QA")
        done()
      })
    })
  })
  suite("PUT /api/issues/{project}", function () {
    test("Update one field", function (done) {
      const newPost = {
        issue_title: "Title 4",
        issue_text: "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.",
        created_by: "bobby",
        assigned_to: "iron",
        status_text: "fixing"
      }
      let successfulChange = {
        created_by: "harry"
      }

      chai.request(server)
      .post('/api/issues/test')
      .send(newPost)
      .end((err, res) => {
        successfulChange["_id"] = res.body._id
        chai.request(server)
          .put('/api/issues/test')
          .send(successfulChange)
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.deepEqual(res.body, {
              result: "successfully updated",
              _id: successfulChange._id
            })
            chai.request(server)
              .get(`/api/issues/test?_id=${successfulChange._id}`)
              .send(successfulChange)
              .end((err, res) => {
                assert.equal(res.status, 200)
                assert.isArray(res.body)
                assert.property(res.body[res.body.length-1], "created_by")
                assert.equal(res.body[res.body.length-1].created_by, "harry")
                done()
              })
          })
      })
    })
    test("update multiple fields", function (done) {
      const newPost = {
        issue_title: "Title 5",
        issue_text: "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.",
        created_by: "user 5",
        assigned_to: "omega",
        status_text: "in testing"
      }
      let successfulChange = {
        created_by: "harry",
        assigned_to: "someone else"
      }
      chai.request(server)
      .post('/api/issues/test')
      .send(newPost)
      .end((err, res) => {
        assert.equal(res.status, 200)
        successfulChange._id = res.body._id
        chai.request(server)
        .put('/api/issues/test')
        .send(successfulChange)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.deepEqual(res.body, {
            result: "successfully updated",
            _id: successfulChange._id
          })
          chai.request(server)
          .get('/api/issues/test')
          .send(successfulChange)
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.isArray(res.body)
            assert.property(res.body[res.body.length-1], "created_by")
            assert.equal(res.body[res.body.length-1].created_by, "harry")
            assert.property(res.body[res.body.length-1], "assigned_to")
            assert.equal(res.body[res.body.length-1].assigned_to, "someone else")
            done()
          })
        })
      })
    })
    test("update an issue with missing id", function (done) {
      chai.request(server)
      .put('/api/issues/test')
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.deepEqual(res.body, {
          error: "missing _id"
        })
        done()
      })
    })
    test("update an issue with no fields to update", function (done) {
      chai.request(server)
      .get('/api/issues/test')
      .query({})
      .end((err, res) => {
        const lastTestId = res.body[res.body.length-1]._id
        chai.request(server)
          .put('/api/issues/test')
          .send({_id: lastTestId})
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.isObject(res.body)
            assert.deepEqual(res.body, {
              error: "no update field(s) sent",
              _id: lastTestId
            })
            done()
          })
      })
    })
    test("update an issue with invalid _id", function (done) {
      const objWithInvalidId = {
        _id: "what",
        created_by: "sazk"
      }
      chai.request(server)
      .put('/api/issues/test')
      .send(objWithInvalidId)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.deepEqual(res.body, {
          error: "could not update",
          _id: objWithInvalidId._id
        })
        done()
      })
    })
  })
  suite("DELETE /api/issues/{project}", function () {
    test("delete an issue", function (done) {
      chai.request(server)
      .post('/api/issues/test')
      .send({
        issue_title: "title 6",
        issue_text: "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.",
        created_by: "sazk"
      })
      .end((err, res) => {
        chai.request(server)
        .get('/api/issues/test')
        .query({})
        .end((err, res) => {
          const idToDelete = res.body[res.body.length-1]._id
          chai.request(server)
          .delete('/api/issues/test')
          .send({
            _id: idToDelete
          })
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.isObject(res.body)
            assert.equal(res.body.result, "successfully deleted")
            assert.equal(res.body._id, idToDelete)
            done()
          })
        })
      })
    })
    test("delete an issue with invalid _id", function (done) {
      const objWithInvalidId = {
        _id: "what"
      }
      chai.request(server)
      .delete('/api/issues/test')
      .send(objWithInvalidId)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.isObject(res.body)
        assert.deepEqual(res.body, {
          error: "could not delete",
          _id: objWithInvalidId._id
        })
        done()
      })
    })
    test("delete an issue with missing _id", function (done) {
      chai.request(server)
      .delete('/api/issues/test')
      .end((err, res) => {
        assert.isObject(res.body)
        assert.equal(res.body.error, "missing _id")
        done()
      })
    })
  })
});
