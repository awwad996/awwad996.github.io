var pdfFiles = [];
var signature = null;
var blobFiles = [];

function changePDF(file) {
	PDFViewerApplication.open({
		url: URL.createObjectURL(file),
		originalUrl: file.name
    })
}

$(document).on('change', '#directoryInput', function() {
	listPDFs();
});

$(document).on('click', '#signAllDocs', function() {
	signAllDocuments();
});

$(document).on('click', '#clearAll', function() {
	PDFViewerApplication.close();
	$("#directoryInput").val(null);
	pdfFiles = [];
	signature = null;
	blobFiles = [];
	$(this).prop('disabled', true);
});

function listPDFs() {
	pdfFiles = [];
	
    const directoryInput = document.getElementById('directoryInput');
    const files = directoryInput.files;

	
    if (files.length === 0) {
		console.log(files.length);
        alert("The selected directory is empty");
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.webkitRelativePath.split('/').length === 2 && file.type === 'application/pdf') {
			pdfFiles.push(file);
        }
    }
	
	if(pdfFiles.length > 0) {
		changePDF(pdfFiles[0]);
		$('#clearAll').prop('disabled', false);
	}
	else {
		alert("No PDF Documents found in the selected directory");
	}
}

async function signAllDocuments() {
	if(PDFViewerApplication.pdfDocument != null) {
		signature = PDFViewerApplication.pdfDocument._transport.annotationStorage.getAll();
		blobFiles = [];
		if (signature != null) {
			$("#loading-indicator").show();
			PDFViewerApplication.close();
			for (var f = 0; f < pdfFiles.length; f++) {
				await new Promise((resolve, reject) => {
					PDFViewerApplication.open({
						url: URL.createObjectURL(pdfFiles[f]),
						originalUrl: pdfFiles[f].name
					}).then(function() {
						PDFViewerApplication.pdfDocument._transport.annotationStorage.setAll(signature);
						PDFViewerApplication.save().then(() => {
							console.log(blobFiles);
							resolve(); 
						}).catch(error => {
							reject(error);
						});
					}).catch(function(error) {
						console.error('Error loading PDF document:', error);
						reject(error); 
					});
				});
			}
			
			if(blobFiles.length > 0) {
				createZipAndDownload();
			}
			else {
				 alert("An error occurred while saving signed documents. Please try again later.");
				 $("#loading-indicator").fadeOut();
			}
			
			
		} else {
			alert("document not signed!");
			return;
		}
	}
	else {
		alert("No documents selected!");
		return;
	}
}

function createZipAndDownload() {
    var zip = new JSZip();
    var currentDate = new Date();
    var dateString = currentDate.toISOString().split("T")[0];
    var timeString = currentDate.toLocaleTimeString("en-US", {hour12: false}).replace(/:/g, "-");

    var folderName = dateString + "_" + timeString;

    blobFiles.forEach((blobObject, index) => {
        zip.file(blobObject.file, blobObject.blob);
    });

    zip.generateAsync({ type: "blob" }).then(function (content) {
        saveAs(content, folderName + ".zip");
    });
	
	PDFViewerApplication.open({
		url: URL.createObjectURL(blobFiles[0].blob),
		originalUrl: 'PDF Signer' 
	}).then(function() {
        PDFViewerApplication.pdfDocument._transport.annotationStorage.setAll(signature);                 
    }).catch(function(error) {
        console.error('Error loading PDF document:', error);
        reject(error); 
    });
	

	$("#loading-indicator").fadeOut();
}

function alert(message) {
	Swal.fire({
	  title: 'Error!',
	  text: message,
	  icon: 'error',
	  confirmButtonText: 'Ok, got it!'
	});
}