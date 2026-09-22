<?php

namespace App\Services;

use App\Models\Pelanggan;
use Illuminate\Support\Collection;
use XMLWriter;

class KmlService
{
    public function customers(Collection $customers, string $name): string
    {
        $xml = new XMLWriter;
        $xml->openMemory();
        $xml->startDocument('1.0', 'UTF-8');
        $xml->startElementNS(null, 'kml', 'http://www.opengis.net/kml/2.2');
        $xml->startElement('Document');
        $xml->writeElement('name', $name);

        foreach ($customers as $customer) {
            $this->placemark($xml, $customer);
        }

        $xml->endElement();
        $xml->endElement();
        $xml->endDocument();

        return $xml->outputMemory();
    }

    private function placemark(XMLWriter $xml, Pelanggan $customer): void
    {
        if (! $customer->lokasi) {
            return;
        }

        $xml->startElement('Placemark');
        $xml->writeElement('name', $customer->nama_pelanggan);
        $xml->writeElement('description', $customer->alamat);
        $xml->startElement('Point');
        $xml->writeElement('coordinates', "{$customer->lokasi->longitude},{$customer->lokasi->latitude},0");
        $xml->endElement();
        $xml->endElement();
    }
}
