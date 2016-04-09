const ANNOTATOR_STORAGE = "http://192.168.99.100:5050"

jQuery(window).load(function(){
  if(typeof(Storage) !== "undefined") {
      // Get login data returns from server and stored here
      // nobita test user
      // localStorage.setItem("token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1ZWRBdCI6IjIwMTYtMDQtMTBUMDI6MDA6MDAuMzAwMTk1KzAwOjAwIiwiY29uc3VtZXJLZXkiOiJkMGUxYmNlMDgyMzRmNGM4MjJmNDY5YmI1NzYzMThlNDZlNjUxZTI5YmFhMDM3MzViZmUxZTAxNDZjMzkwZTdkIiwidXNlcklkIjoibm9iaXRhIn0.HFgEisaHVaLOLmhnEU8r-vNzvbdNLPf3Pzmm5mf2eP4");
      
      // alice test user
      localStorage.setItem("token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1ZWRBdCI6IjIwMTYtMDQtMDlUMDI6MDA6MDAuMzAwMTk1KzAwOjAwIiwiY29uc3VtZXJLZXkiOiJkMGUxYmNlMDgyMzRmNGM4MjJmNDY5YmI1NzYzMThlNDZlNjUxZTI5YmFhMDM3MzViZmUxZTAxNDZjMzkwZTdkIiwidXNlcklkIjoiYWxpY2UifQ.ww4LyiKGb7_x8Jh4bwAa0zOdJlWvV_7u7HzWH67GdhM");
  } else {
      // No Web Storage support...
  }
  getAnnotation();
  addAnnotationHandler();
  updateAnnotationHandler();
  deleteAnnotationHandler();
});

function addAnnotationHandler() {
  anno.addHandler('onAnnotationCreated', function(annotation) {
    annotation.context=annotation.context.split("?")[0]; 
    jQuery.ajax({
      type: "POST",
      url: ANNOTATOR_STORAGE + "/annotations",
      dataType: "JSON",
      data: JSON.stringify(annotation),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      headers: {
        'x-annotator-auth-token': localStorage.getItem("token")
      },
      success: function(data) {
        console.log("Create Success: " + data.id);
        annotation.id = data.id;
      },
      error: function(response) {
        console.log(JSON.stringify(response));
        anno.removeAnnotation(annotation);

        // Login required
        // Check if response.status = 401 (UNAUTHORIZED)
        // Redirect user to login page
        if (response.status == 401) {
          alert("Cannot create annotation: Login required");
        }

        // Permission definied
        // Check if response.status = 403 (PERMISSION DENIED)
        if (response.status == 403) {
          alert("Cannot create annotation: Permission denied.");
        }
        
      }
    });
  });
}

function updateAnnotationHandler() {
  anno.addHandler('onAnnotationUpdated', function(annotation) {
    annotation.context=annotation.context.split("?")[0]; 
    jQuery.ajax({
      type: "PUT",
      url: ANNOTATOR_STORAGE + "/annotations/" + annotation.id,
      dataType: "JSON",
      data: JSON.stringify(annotation),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      headers: {
        'x-annotator-auth-token': localStorage.getItem("token")
      },
      success: function(data) {
        console.log("Update Success: " + data.id);
        console.log(JSON.stringify(data));
      },
      error: function(response) {
        // alert permission denied
        alert("Cannot update annotation: Permission denied.");

        // roll back to text before update
        jQuery.ajax({
          type: "GET",
          url: ANNOTATOR_STORAGE + "/annotations/" + annotation.id,
          headers: {
            'x-annotator-auth-token': localStorage.getItem("token")
          },
          success: function(data) {
            annotation.text = data.text;
          },
        });
      }
    });
  });
}

function deleteAnnotationHandler() {
  // Confirm before removing annotations
  anno.addHandler('beforeAnnotationRemoved', function(annotation) {
    var r=confirm("Is it OK to delete this annotation?");
    if (r==false) { return false;}
  });

  anno.addHandler('onAnnotationRemoved', function(annotation) {
  annotation.context=annotation.context.split("?")[0]; 
  jQuery.ajax({
    type: "DELETE",
    url: ANNOTATOR_STORAGE + "/annotations/" + annotation.id,
    dataType: "JSON",
    data: JSON.stringify(annotation),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    headers: {
      'x-annotator-auth-token': localStorage.getItem("token")
    },
    success: function(data) {
      console.log("Delete Success");
    },
    error: function(response) {
      // alert error message
      alert("Cannot delete annotation: Permission denied.");

      // roll back deleted annotation
      jQuery.ajax({
        type: "GET",
        url: ANNOTATOR_STORAGE + "/annotations/" + annotation.id,
        headers: {
          'x-annotator-auth-token': localStorage.getItem("token")
        },
        success: function(data) {
          console.log(JSON.stringify(data));
          anno.addAnnotation(data);
        },
      });
    }
    });
  });
}

function getAnnotation() {
  jQuery.ajax({
    type: "GET",
    url: ANNOTATOR_STORAGE + "/annotations",
    success: function(data) {
      for (var i = 0; i < data.length; i++) {
        anno.addAnnotation(data[i]);
      }
    }
  });
}

function getAnnotationById(annotationId) {
  jQuery.ajax({
    type: "GET",
    url: ANNOTATOR_STORAGE + "/annotations/" + annotationId,
    success: function(data) {
      return data;
    }
  });
}