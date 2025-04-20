const no = document.querySelector("#price");

let alphabets = "abcdefghijklmnopqrstuwxyz";
no.addEventListener("input", function () {
	const userValue = no.value;
	const arr = userValue.split("");
	arr.forEach(function (a) {
		if (a === ".") {
			no.value = no.value;
		} else if (alphabets.includes(a) || isNaN(parseInt(a))) {
			no.value = "";
		}
	});
});
const form = document.querySelector("#forms");
const img = document.querySelector("#images");

//const overlay = document.getElementById("updatingOverlay");

// const check = document.querySelector('.form-check');
form.addEventListener("submit", function (e) {
	const fileLength = img.files.length;
	if (fileLength > 7 || fileLength === 0) {
		//validateStyle1()
		img.style.backgroundImage = "none";
		console.log("FDSFS", fileLength);
		showToast(
			`upload ${fileLength == 0 ? "atleast " + 1 : "atmost " + 7} image`,
			"warning"
		);
		e.preventDefault();
	} else {
		// validateStyle2()
		let path = window.location.pathname.split("/").slice(-1)[0];
		showOverLay(
			`${path == "new" ? "Creating" : "Updating"} campground,` +
				" please wait..."
		);
	}
});

// img.addEventListener('change', function () {
//     const fileLength = img.files.length;
//     if (fileLength > 7) {
//            validateStyle1()
//             //check.textContent='Only 7 Images needed for uploading'
//     }
//     else {
//         validateStyle2()
//         check.style.color = '#198754';
//     }
// })

// function validateStyle2() {
//         img.style.borderColor='#198754'
//         check.classList.add('valid-feedback')
//         check.textContent='Looks good!'
// }

// function validateStyle1() {
//         check.style.display = 'block';
//         check.classList.add('valid-feedback')
//         check.style.color = '#dc3545';
//         img.style.borderColor = '#dc3545';
// }
