// Copyright 2018 The Distill Template Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { collect_citations } from '../helpers/citation.js';

export default function(dom, data) {
  const citations = new Set(data.citations);
  const newCitations = collect_citations(dom);
  for (const citation of newCitations) {
    citations.add(citation);
  }
  data.citations = Array.from(citations);
}
