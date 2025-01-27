import {
	FileLoader,
	Loader,
} from 'three';

const _face_vertex_data_separator_pattern = /\s+/;

class OffFileLoader extends Loader {

	constructor(manager) {
		super(manager);
	}

	load(url, onLoad, onProgress, onError) {
		const scope = this;

		const loader = new FileLoader(this.manager);
		loader.setPath(this.path);
		loader.setRequestHeader(this.requestHeader);
		loader.setWithCredentials(this.withCredentials);
		loader.load(url, function (text) {

			try {
				onLoad(scope.parse(text));
			} catch (e) {
				if (onError) {
					onError(e);
				} else {
					console.error(e);
				}
				scope.manager.itemError(url);
			}
		}, onProgress, onError);
	}

	parse(text) {
		if (text.indexOf('\r\n') !== -1) {
			// This is faster than String.split with regex that splits on both
			text = text.replace(/\r\n/g, '\n');
		}

		if (text.indexOf('\\\n') !== -1) {
			// join lines separated by a line continuation character (\)
			text = text.replace(/\\\n/g, '');
		}

		const lines = text.split('\n');
		const result = {
			vertices: [],
			faces: [],
			edges: [],
			verticesColor: [],
			facesColor: [],
			edgesColor: [],
			text:text,
		};
		const headerKeyword = lines[0].trimStart();
		if (!headerKeyword == "OFF") {
			return result;
		}
		let i = 1;
		let l = lines.length;
		let numbers;

		for (; i < l; i++) {
			const line = lines[i].trim();
			if (line.length === 0) continue;
			const lineFirstChar = line.charAt(0);
			if (lineFirstChar === '#') continue;

			numbers = line.split(_face_vertex_data_separator_pattern).map(el => parseInt(el, 10));
			i++;
			break;
		}
		const numberVertices = numbers[0];
		const numberFaces = numbers[1];

		for (; i < l; i++) {
			const line = lines[i].trim();
			if (line.length === 0) continue;
			const lineFirstChar = line.charAt(0);
			if (lineFirstChar === '#') continue;
			const data = line.split(_face_vertex_data_separator_pattern);
			result.vertices.push(data.slice(0, 3).map(el => parseFloat(el, 10)));
			if (result.vertices.length >= numberVertices) {
				i++;
				break;
			}
		}

		for (; i < l; i++) {
			const line = lines[i].trim();
			if (line.length === 0) continue;
			const lineFirstChar = line.charAt(0);
			if (lineFirstChar === '#') continue;

			const vertexData = line.split(_face_vertex_data_separator_pattern);
			const faceNum = parseInt(vertexData.slice(0, 1), 10);
			// Parse the face vertex data into an easy to work with format
			if (faceNum > 2) {
				result.faces.push(vertexData.slice(1, faceNum + 1).map(el => parseFloat(el, 10)));
				if (vertexData.length > faceNum + 1) {
					result.facesColor.push(vertexData.slice(faceNum + 1).map(el => parseFloat(el, 10)));
				}
			}
			else if (faceNum == 2) {
				const i0 = parseFloat(vertexData[1], 10);
				const i1 = parseFloat(vertexData[2], 10);
				let edge;
				if (i0 > i1) {
					edge = "" + i1 + "," + i0;
				}
				else {
					edge = "" + i0 + "," + i1;
				}
				result.edges.push(edge);
				if (vertexData.length > faceNum + 1) {
					result.edgesColor.push(vertexData.slice(faceNum + 1).map(el => parseFloat(el, 10)));
				}
			}
			else if (faceNum == 1) {
				if (vertexData.length > faceNum + 1) {
					result.verticesColor.push(vertexData.slice(faceNum + 1).map(el => parseFloat(el, 10)));
				}
			}
		}


		// add misssing edges
		for (let face of result.faces) {
			for (let j = 0, jl = face.length; j < jl; j++) {
				const i0 = face[j];
				const i1 = face[(j + 1) % jl];
				let edge;
				if (i0 > i1) {
					edge = "" + i1 + "," + i0;
				}
				else {
					edge = "" + i0 + "," + i1;
				}
				if (!result.edges.includes(edge)) {
					result.edges.push(edge);
				}
			}
		}
		for (let i = 0, l = result.edges.length; i < l; ++i) {
			const edgeParts = result.edges[i].split(',');
			result.edges[i] = [parseInt(edgeParts[0], 10), parseInt(edgeParts[1], 10)]
		}
		return result;
	}
}

export {
	OffFileLoader
};
